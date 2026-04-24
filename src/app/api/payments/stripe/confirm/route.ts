import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { ads, payments, users, locations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";
import { sendAdSubmittedEmail, sendPaymentReceiptEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

// POST /api/payments/stripe/confirm
// Called from the success page as a fallback in case the webhook was delayed.
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const { sessionId, adId } = await req.json();
    if (!sessionId || !adId) {
      return NextResponse.json({ success: false, error: "Missing params" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      checkoutSession.payment_status !== "paid" ||
      checkoutSession.metadata?.adId !== adId ||
      checkoutSession.metadata?.userId !== userId
    ) {
      return NextResponse.json({ success: false, error: "Payment not confirmed" }, { status: 400 });
    }

    // Check if already paid (webhook may have already processed it)
    const [existing] = await db
      .select({ paymentStatus: ads.paymentStatus })
      .from(ads)
      .where(and(eq(ads.id, adId), eq(ads.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    }

    if (existing.paymentStatus === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const now = new Date();

    // Record payment
    await db.insert(payments).values({
      adId,
      userId,
      provider: "stripe",
      providerTxId: checkoutSession.payment_intent as string,
      status: "paid",
      amountCents: checkoutSession.amount_total ?? 10000,
      currency: (checkoutSession.currency ?? "usd").toUpperCase(),
    });

    // Mark ad as paid
    await db.update(ads).set({ paymentStatus: "paid", updatedAt: now }).where(eq(ads.id, adId));

    // Send confirmation email
    const [row] = await db
      .select({
        ad: ads,
        user: { id: users.id, name: users.name, email: users.email },
        location: { storeName: locations.storeName },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(eq(ads.id, adId))
      .limit(1);

    if (row) {
      const amount = `$${((checkoutSession.amount_total ?? 10000) / 100).toFixed(2)}`;
      sendPaymentReceiptEmail({
        to: row.user.email,
        userName: row.user.name,
        adTitle: row.ad.title,
        locationName: row.location.storeName,
        amountFormatted: amount,
        provider: "stripe",
        adId,
      }).catch(console.error);
      sendAdSubmittedEmail({
        to: row.user.email,
        userName: row.user.name,
        adTitle: row.ad.title,
        locationName: row.location.storeName,
        adId,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/payments/stripe/confirm]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
