import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, payments, users, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { sendAdSubmittedEmail, sendPaymentReceiptEmail, sendAdReviewNotificationEmail } from "@/lib/email/templates";
import { recordEarning } from "@/lib/earnings";
import { notifyPaymentRecorded } from "@/lib/notifications";
import { completeProposalPayment, proposalForAd } from "@/lib/proposal-payments";
import { formatLocationLabel } from "@/lib/location-label";

/**
 * Records a paid Stripe Checkout session for an ad (the success-page fallback in case the webhook is late).
 * The caller has already checked who may confirm it; this checks the session itself: paid, and for this ad
 * and user. Safe to call twice and alongside the webhook (the payment intent is recorded once).
 */
export async function recordPaidCheckout(checkoutSession: Stripe.Checkout.Session, adId: string, userId: string) {
  if (
    checkoutSession.payment_status !== "paid" ||
    checkoutSession.metadata?.adId !== adId ||
    checkoutSession.metadata?.userId !== userId
  ) {
    return { ok: false as const, error: "Payment not confirmed", status: 400 };
  }

  // Already paid (the webhook may have processed it)
  const [existing] = await db
    .select({ paymentStatus: ads.paymentStatus })
    .from(ads)
    .where(and(eq(ads.id, adId), eq(ads.userId, userId)))
    .limit(1);
  if (!existing) return { ok: false as const, error: "Ad not found", status: 404 };
  if (existing.paymentStatus === "paid") return { ok: true as const, alreadyPaid: true };

  const paymentIntentId = checkoutSession.payment_intent as string;
  const [alreadyRecorded] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.providerTxId, paymentIntentId))
    .limit(1);
  if (alreadyRecorded) return { ok: true as const, alreadyPaid: true };

  const now = new Date();
  const amountCents = checkoutSession.amount_total ?? 10000;

  const [payment] = await db.insert(payments).values({
    adId,
    userId,
    provider: "stripe",
    providerTxId: paymentIntentId,
    status: "paid",
    amountCents,
    currency: (checkoutSession.currency ?? "usd").toUpperCase(),
  }).returning({ id: payments.id });

  // A sales proposal ad goes live at once, without review
  const fromProposal = !!(await proposalForAd(adId));
  await recordEarning(payment.id);
  await notifyPaymentRecorded(payment.id, { live: fromProposal });

  await db.update(ads).set({ paymentStatus: "paid", updatedAt: now }).where(eq(ads.id, adId));
  if (fromProposal) await completeProposalPayment(adId, amountCents);

  // Confirmation emails
  const [row] = await db
    .select({
      ad: ads,
      user: { id: users.id, name: users.name, email: users.email },
      location: {
        storeName: locations.storeName,
        storeNumber: locations.storeNumber,
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
    .where(eq(ads.id, adId))
    .limit(1);

  if (row) {
    const locationName = formatLocationLabel(row.location);
    sendPaymentReceiptEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      locationName,
      amountFormatted: `$${(amountCents / 100).toFixed(2)}`,
      provider: "stripe",
      adId,
    }).catch(console.error);
    if (!fromProposal) {
      sendAdSubmittedEmail({ to: row.user.email, userName: row.user.name, adTitle: row.ad.title, locationName, adId }).catch(console.error);
      sendAdReviewNotificationEmail({ adTitle: row.ad.title, locationName, userName: row.user.name, adId }).catch(console.error);
    }
  }

  return { ok: true as const, alreadyPaid: false };
}
