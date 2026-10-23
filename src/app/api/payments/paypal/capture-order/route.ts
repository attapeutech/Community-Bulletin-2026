import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, payments, users, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { capturePayPalOrder } from "@/lib/paypal";
import { sendAdSubmittedEmail, sendPaymentReceiptEmail, sendAdReviewNotificationEmail } from "@/lib/email/templates";
import { recordEarning } from "@/lib/earnings";
import { notifyPaymentRecorded } from "@/lib/notifications";

const schema = z.object({
  adId: z.string().uuid(),
  orderId: z.string().min(1),
});

// POST /api/payments/paypal/capture-order
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const { adId, orderId } = schema.parse(body);

    const [row] = await db
      .select({
        ad: ads,
        user: { id: users.id, name: users.name, email: users.email },
        location: {
          storeName: locations.storeName,
          pricePerWeekCents: locations.pricePerWeekCents,
          addressLine1: locations.addressLine1,
          cityName: cities.name,
          stateCode: states.code,
          postalCode: postalCodes.code,
        },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
      .where(and(eq(ads.id, adId), eq(ads.userId, userId)))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 }
      );
    }

    if (row.ad.paymentStatus !== "unpaid") {
      return NextResponse.json(
        { success: false, error: "Ad is already paid" },
        { status: 409 }
      );
    }

    // Capture the PayPal order
    const capture = await capturePayPalOrder(orderId);
    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = captureUnit?.id ?? orderId;
    const captureStatus = captureUnit?.status ?? capture.status;
    const paypalFee = captureUnit?.seller_receivable_breakdown?.paypal_fee?.value;
    const feeCents = paypalFee ? Math.round(parseFloat(paypalFee) * 100) : null;
    // Record what PayPal actually captured; fall back to the location's price
    const capturedValue = captureUnit?.amount?.value;
    const amountCents = capturedValue ? Math.round(parseFloat(capturedValue) * 100) : row.location.pricePerWeekCents;

    const now = new Date();

    // Record payment
    const [payment] = await db.insert(payments).values({
      adId,
      userId,
      provider: "paypal",
      providerTxId: captureId,
      status: captureStatus,
      amountCents,
      currency: "USD",
      feeCents,
    }).returning({ id: payments.id });

    await recordEarning(payment.id);
    await notifyPaymentRecorded(payment.id);

    // Mark ad as paid
    await db
      .update(ads)
      .set({ paymentStatus: "paid", updatedAt: now })
      .where(eq(ads.id, adId));

    const { storeName, addressLine1, cityName, stateCode, postalCode } = row.location;
    const locationName = `${storeName} — ${addressLine1}, ${cityName}, ${stateCode} ${postalCode}`;
    const amount = `$${(amountCents / 100).toFixed(2)}`;

    // Send emails (non-blocking)
    sendPaymentReceiptEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      locationName,
      amountFormatted: amount,
      provider: "paypal",
      adId,
    }).catch(console.error);
    sendAdSubmittedEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      locationName,
      adId,
    }).catch(console.error);
    sendAdReviewNotificationEmail({
      adTitle: row.ad.title,
      locationName,
      userName: row.user.name,
      adId,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 422 }
      );
    }
    console.error("[POST /api/payments/paypal/capture-order]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
