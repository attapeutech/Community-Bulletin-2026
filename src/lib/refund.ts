import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { ads, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { refundPayPalCapture } from "./paypal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

export type RefundResult = {
  attempted: boolean;
  status: "refunded" | "refund_pending" | "no_payment";
  amountCents: number;
  provider: string;
};

/**
 * Looks up the payment for an ad and issues a full refund via Stripe or PayPal.
 * Updates both the payments row and ads.paymentStatus accordingly.
 * Falls back to "refund_pending" if the provider call fails.
 */
export async function processAdRefund(adId: string): Promise<RefundResult> {
  const now = new Date();

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.adId, adId))
    .limit(1);

  if (!payment) {
    return { attempted: false, status: "no_payment", amountCents: 0, provider: "" };
  }

  // Already refunded — skip
  if (payment.status === "refunded") {
    return { attempted: false, status: "refunded", amountCents: payment.amountCents, provider: payment.provider };
  }

  if (payment.provider === "stripe") {
    try {
      const refund = await stripe.refunds.create({ payment_intent: payment.providerTxId });
      await db.update(payments).set({
        status: "refunded",
        providerRefundId: refund.id,
        refundedAt: now,
        updatedAt: now,
      }).where(eq(payments.id, payment.id));
      await db.update(ads).set({ paymentStatus: "refunded", updatedAt: now }).where(eq(ads.id, adId));
      return { attempted: true, status: "refunded", amountCents: payment.amountCents, provider: "stripe" };
    } catch (err) {
      console.error("[Stripe refund error]", err);
      await db.update(ads).set({ paymentStatus: "refund_pending", updatedAt: now }).where(eq(ads.id, adId));
      return { attempted: true, status: "refund_pending", amountCents: payment.amountCents, provider: "stripe" };
    }
  }

  if (payment.provider === "paypal") {
    try {
      const refund = await refundPayPalCapture(payment.providerTxId, payment.amountCents);
      await db.update(payments).set({
        status: "refunded",
        providerRefundId: refund.id,
        refundedAt: now,
        updatedAt: now,
      }).where(eq(payments.id, payment.id));
      await db.update(ads).set({ paymentStatus: "refunded", updatedAt: now }).where(eq(ads.id, adId));
      return { attempted: true, status: "refunded", amountCents: payment.amountCents, provider: "paypal" };
    } catch (err) {
      console.error("[PayPal refund error]", err);
      await db.update(ads).set({ paymentStatus: "refund_pending", updatedAt: now }).where(eq(ads.id, adId));
      return { attempted: true, status: "refund_pending", amountCents: payment.amountCents, provider: "paypal" };
    }
  }

  // Unknown provider — flag for manual handling
  await db.update(ads).set({ paymentStatus: "refund_pending", updatedAt: now }).where(eq(ads.id, adId));
  return { attempted: true, status: "refund_pending", amountCents: payment.amountCents, provider: payment.provider };
}
