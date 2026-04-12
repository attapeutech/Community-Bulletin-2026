import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, payments } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { capturePayPalOrder } from "@/lib/paypal";
import { AD_PRICE_CENTS } from "@/types";
import { sendAdSubmittedEmail } from "@/lib/email/templates";
import { users, locations } from "@/lib/db/schema";

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
        location: { storeName: locations.storeName },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
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

    const now = new Date();

    // Record payment
    await db.insert(payments).values({
      adId,
      userId,
      provider: "paypal",
      providerTxId: captureId,
      status: captureStatus,
      amountCents: AD_PRICE_CENTS,
      currency: "USD",
    });

    // Mark ad as paid
    await db
      .update(ads)
      .set({ paymentStatus: "paid", updatedAt: now })
      .where(eq(ads.id, adId));

    // Send submission email (non-blocking)
    sendAdSubmittedEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      locationName: row.location.storeName,
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
