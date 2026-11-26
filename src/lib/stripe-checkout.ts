import type Stripe from "stripe";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adOrders, ads, payments, users, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { sendAdSubmittedEmail, sendPaymentReceiptEmail, sendAdReviewNotificationEmail } from "@/lib/email/templates";
import { fillStripeFees, recordEarning } from "@/lib/earnings";
import { notifyPaymentRecorded } from "@/lib/notifications";
import { completeProposalPayment, proposalForAd } from "@/lib/proposal-payments";
import { formatLocationLabel } from "@/lib/location-label";
import { stripe } from "@/lib/stripe";

/**
 * Records a paid Stripe Checkout session. Used by the webhook and by the success page (in case the webhook
 * is late). Safe to call twice and from both (the payment intent is recorded once).
 *
 * - Single-store ad (metadata.adId): one payment row for the whole amount, as before.
 * - Multi-store order (metadata.orderId): one payment row per store's ad, each with that store's line
 *   amount from the checkout (each line carries its adId), so earnings, refunds and fees stay per store.
 *
 * The caller has already checked who may confirm it; this checks the session itself: paid, and for this
 * ad (or an ad in this order) and user.
 */
export async function recordPaidCheckout(checkoutSession: Stripe.Checkout.Session, adId: string, userId: string) {
  const orderId = checkoutSession.metadata?.orderId;
  if (
    checkoutSession.payment_status !== "paid" ||
    checkoutSession.metadata?.adId !== adId ||
    checkoutSession.metadata?.userId !== userId
  ) {
    return { ok: false as const, error: "Payment not confirmed", status: 400 };
  }
  if (orderId) return recordPaidOrder(checkoutSession, orderId, userId);

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
  // Sales tax is inside the total; the store's rate and area are kept with the payment for the tax report
  const taxCents = checkoutSession.total_details?.amount_tax ?? 0;
  const [tax] = await storeTax([adId]);

  const [payment] = await db.insert(payments).values({
    adId,
    userId,
    provider: "stripe",
    providerTxId: paymentIntentId,
    status: "paid",
    amountCents,
    currency: (checkoutSession.currency ?? "usd").toUpperCase(),
    ...taxFields(taxCents, tax),
  }).returning({ id: payments.id });

  // A sales proposal ad goes live at once, without review
  const fromProposal = !!(await proposalForAd(adId));
  await recordEarning(payment.id);
  await notifyPaymentRecorded(payment.id, { live: fromProposal });

  await db.update(ads).set({ paymentStatus: "paid", updatedAt: now }).where(eq(ads.id, adId));
  if (fromProposal) await completeProposalPayment(adId, amountCents);
  await fillStripeFees(paymentIntentId);   // Stripe's fee, for CB's Revenue page (the daily job retries)

  // Confirmation emails
  const rows = await adEmailRows([adId]);
  const row = rows[0];
  if (row) {
    const locationName = formatLocationLabel(row.location);
    sendPaymentReceiptEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      locationName,
      amountFormatted: `$${(amountCents / 100).toFixed(2)}`,
      taxFormatted: taxCents > 0 ? `$${(taxCents / 100).toFixed(2)}` : undefined,
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

/** A multi-store order: one payment row per store's ad, from the checkout's lines */
async function recordPaidOrder(checkoutSession: Stripe.Checkout.Session, orderId: string, userId: string) {
  const paymentIntentId = checkoutSession.payment_intent as string;
  const [alreadyRecorded] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.providerTxId, paymentIntentId))
    .limit(1);
  if (alreadyRecorded) return { ok: true as const, alreadyPaid: true };

  // Each line was created with its ad's id (see create-checkout)
  const lines = await stripe.checkout.sessions.listLineItems(checkoutSession.id, { limit: 100, expand: ["data.price.product"] });
  const amountByAd = new Map<string, number>();
  const taxByAd = new Map<string, number>();
  for (const li of lines.data) {
    const product = li.price?.product as Stripe.Product | string | undefined;
    const lineAdId = product && typeof product === "object" ? product.metadata?.adId : undefined;
    if (lineAdId) {
      // amount_total includes the line's sales tax
      amountByAd.set(lineAdId, (amountByAd.get(lineAdId) ?? 0) + (li.amount_total ?? 0));
      taxByAd.set(lineAdId, (taxByAd.get(lineAdId) ?? 0) + (li.amount_tax ?? 0));
    }
  }

  if (!amountByAd.size) {
    console.error(`[stripe-checkout] order ${orderId}: checkout ${checkoutSession.id} has no store lines`);
    return { ok: false as const, error: "Order details missing from the payment", status: 400 };
  }

  const orderAds = await db
    .select({ id: ads.id, paymentStatus: ads.paymentStatus })
    .from(ads)
    .where(and(eq(ads.orderId, orderId), eq(ads.userId, userId), inArray(ads.id, [...amountByAd.keys()])));
  const toRecord = orderAds.filter((a) => a.paymentStatus === "unpaid");
  if (!orderAds.length) return { ok: false as const, error: "Order not found", status: 404 };
  if (!toRecord.length) return { ok: true as const, alreadyPaid: true };

  const now = new Date();
  const currency = (checkoutSession.currency ?? "usd").toUpperCase();
  const taxes = new Map((await storeTax(toRecord.map((a) => a.id))).map((t) => [t.adId, t]));
  const inserted = await db.insert(payments).values(toRecord.map((a) => ({
    adId: a.id,
    userId,
    provider: "stripe" as const,
    providerTxId: paymentIntentId,
    status: "paid",
    amountCents: amountByAd.get(a.id) ?? 0,
    currency,
    ...taxFields(taxByAd.get(a.id) ?? 0, taxes.get(a.id)),
  }))).returning({ id: payments.id, adId: payments.adId, amountCents: payments.amountCents, taxCents: payments.taxCents });

  for (const p of inserted) {
    await recordEarning(p.id);
    await notifyPaymentRecorded(p.id, { live: false });
  }
  await db.update(ads).set({ paymentStatus: "paid", updatedAt: now }).where(inArray(ads.id, toRecord.map((a) => a.id)));
  await db.update(adOrders).set({ paidAt: now }).where(eq(adOrders.id, orderId));
  await fillStripeFees(paymentIntentId);   // split across the stores' rows by amount

  // One receipt and one "submitted" email for the whole order; one review email listing the stores
  const rows = await adEmailRows(toRecord.map((a) => a.id));
  if (rows.length) {
    const first = rows[0];
    const stores = rows.map((r) => formatLocationLabel(r.location));
    const locationName = stores.length === 1 ? stores[0] : `${stores.length} stores: ${stores.join("; ")}`;
    const total = inserted.reduce((sum, p) => sum + p.amountCents, 0);
    const taxTotal = inserted.reduce((sum, p) => sum + p.taxCents, 0);
    sendPaymentReceiptEmail({
      to: first.user.email, userName: first.user.name, adTitle: first.ad.title, locationName,
      amountFormatted: `$${(total / 100).toFixed(2)}`, provider: "stripe", adId: first.ad.id,
      taxFormatted: taxTotal > 0 ? `$${(taxTotal / 100).toFixed(2)}` : undefined,
    }).catch(console.error);
    sendAdSubmittedEmail({ to: first.user.email, userName: first.user.name, adTitle: first.ad.title, locationName, adId: first.ad.id }).catch(console.error);
    sendAdReviewNotificationEmail({ adTitle: first.ad.title, locationName, userName: first.user.name, adId: first.ad.id }).catch(console.error);
  }

  return { ok: true as const, alreadyPaid: false };
}

/** Each ad's store tax rate and area at the time of payment */
async function storeTax(adIds: string[]) {
  if (!adIds.length) return [];
  return db
    .select({ adId: ads.id, taxRateBps: locations.taxRateBps, taxLocationCode: locations.taxLocationCode, taxAreaName: locations.taxAreaName })
    .from(ads)
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .where(inArray(ads.id, adIds));
}

/** Tax columns for a payment row: the tax Stripe charged, with the store's rate and area (none when no tax) */
function taxFields(taxCents: number, store?: { taxRateBps: number | null; taxLocationCode: string | null; taxAreaName: string | null }) {
  if (!taxCents) return { taxCents: 0 };
  return { taxCents, taxRateBps: store?.taxRateBps ?? null, taxLocationCode: store?.taxLocationCode ?? null, taxAreaName: store?.taxAreaName ?? null };
}

/** Ad, advertiser and store address for confirmation emails */
async function adEmailRows(adIds: string[]) {
  if (!adIds.length) return [];
  return db
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
    .where(inArray(ads.id, adIds));
}
