import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { ads, locations, payments, users, ownerEarnings } from "@/lib/db/schema";
import { eq, and, inArray, isNull, isNotNull, lte, or, sql } from "drizzle-orm";
import { notifyEarningsAvailable, type EarningLine } from "@/lib/notifications";
import { storeEarning } from "@/lib/store-earning";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

export { MIN_PAYOUT_CENTS } from "@/types";

/**
 * Creates a pending earnings row for a new payment.
 * Skipped for locations owned by an admin (platform-owned stores earn nothing).
 * Safe to call more than once for the same payment.
 */
export async function recordEarning(paymentId: string) {
  const [row] = await db
    .select({
      amountCents:       payments.amountCents,
      taxCents:          payments.taxCents,
      currency:          payments.currency,
      adTitle:           ads.title,
      locationId:        locations.id,
      shareRateBps:      locations.shareRateBps,
      ownerId:           users.id,
      ownerRole:         users.role,
    })
    .from(payments)
    .innerJoin(ads,       eq(payments.adId, ads.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(users,     eq(locations.storeOwnerId, users.id))
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!row || row.ownerRole === "admin") return;

  await db
    .insert(ownerEarnings)
    .values({
      paymentId,
      ownerId:      row.ownerId,
      locationId:   row.locationId,
      adTitle:      row.adTitle,
      grossCents:   row.amountCents - row.taxCents,   // the ad price: sales tax isn't shared
      shareRateBps: row.shareRateBps,
      currency:     row.currency,
    })
    .onConflictDoNothing({ target: ownerEarnings.paymentId });
}

/** Called when an ad is approved: its pending earnings become available once the run ends. */
export async function setEarningsAvailableAt(adId: string, runEndsAt: Date) {
  await db
    .update(ownerEarnings)
    .set({ availableAt: runEndsAt, updatedAt: new Date() })
    .where(and(
      eq(ownerEarnings.status, "pending"),
      isNull(ownerEarnings.availableAt),
      inArray(ownerEarnings.paymentId, db.select({ id: payments.id }).from(payments).where(eq(payments.adId, adId))),
    ));
}

/** Called when a payment is refunded: nothing is owed for it. */
export async function voidEarningForPayment(paymentId: string) {
  await db
    .update(ownerEarnings)
    .set({ status: "void", updatedAt: new Date() })
    .where(and(eq(ownerEarnings.paymentId, paymentId), inArray(ownerEarnings.status, ["pending", "available"])));
}

/**
 * Stripe's fee for this payment row. A multi-store checkout is one Stripe payment covering several ads
 * (one payment row each), so the fee is split by each row's share of the total; a single-store ad gets
 * the whole fee, as before.
 */
async function fetchStripeFeeCents(paymentIntentId: string, rowAmountCents: number): Promise<number | null> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge.balance_transaction"],
  });
  const charge = pi.latest_charge as Stripe.Charge | null;
  const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null | undefined;
  if (!bt || typeof bt !== "object") return null;
  if (!pi.amount || rowAmountCents >= pi.amount) return bt.fee;
  return Math.round((bt.fee * rowAmountCents) / pi.amount);
}

/**
 * Saves Stripe's actual fee on payment rows that don't have it yet (for CB's books: Revenue page).
 * By payment intent (a multi-store checkout has one row per store), or, with no id, the most recent
 * paid Stripe payments still missing it (the daily job). Never throws.
 */
export async function fillStripeFees(paymentIntentId?: string, limit = 50) {
  let filled = 0;
  try {
    const rows = await db
      .select({ id: payments.id, providerTxId: payments.providerTxId, amountCents: payments.amountCents })
      .from(payments)
      .where(and(
        eq(payments.provider, "stripe"),
        eq(payments.status, "paid"),
        isNull(payments.feeCents),
        paymentIntentId ? eq(payments.providerTxId, paymentIntentId) : sql`${payments.createdAt} > now() - interval '120 days'`,
      ))
      .orderBy(sql`${payments.createdAt} desc`)
      .limit(limit);
    for (const r of rows) {
      try {
        const fee = await fetchStripeFeeCents(r.providerTxId, r.amountCents);
        if (fee === null) continue;
        await db.update(payments).set({ feeCents: fee, updatedAt: new Date() }).where(eq(payments.id, r.id));
        filled++;
      } catch (err) {
        console.error(`[earnings] Stripe fee lookup failed for ${r.providerTxId}`, err);
      }
    }
  } catch (err) {
    console.error("[earnings] fillStripeFees failed", err);
  }
  return filled;
}

/**
 * Daily job: moves pending earnings to available once the ad run has ended
 * (or the ad was ended early). The owner earns their share of the ad price less the card fee
 * (2.9% of the share + 30¢, see store-earning.ts).
 * Voids earnings whose payment was refunded or deleted.
 */
export async function releaseEarnings(now = new Date()) {
  // Payment refunded or deleted → void
  const voided = await db
    .update(ownerEarnings)
    .set({ status: "void", updatedAt: now })
    .where(and(
      eq(ownerEarnings.status, "pending"),
      or(
        isNull(ownerEarnings.paymentId),
        inArray(ownerEarnings.paymentId, db.select({ id: payments.id }).from(payments).where(eq(payments.status, "refunded"))),
      ),
    ))
    .returning({ id: ownerEarnings.id });

  const due = await db
    .select({
      id:            ownerEarnings.id,
      ownerId:       ownerEarnings.ownerId,
      grossCents:    ownerEarnings.grossCents,
      shareRateBps:  ownerEarnings.shareRateBps,
      adTitle:       ownerEarnings.adTitle,
      paymentId:     payments.id,
      provider:      payments.provider,
      providerTxId:  payments.providerTxId,
      feeCents:      payments.feeCents,
      paymentCents:  payments.amountCents,
    })
    .from(ownerEarnings)
    .innerJoin(payments, eq(ownerEarnings.paymentId, payments.id))
    .innerJoin(ads, eq(payments.adId, ads.id))
    .where(and(
      eq(ownerEarnings.status, "pending"),
      isNotNull(ownerEarnings.availableAt),
      or(lte(ownerEarnings.availableAt, now), lte(ads.endedAt, now)),
    ));

  let released = 0;
  const releasedByOwner = new Map<string, EarningLine[]>();

  for (const e of due) {
    // Stripe's actual fee, for our own books only (the owner's fee is the fixed formula below)
    if (e.feeCents === null && e.provider === "stripe") {
      try {
        const fee = await fetchStripeFeeCents(e.providerTxId, e.paymentCents);
        if (fee !== null) await db.update(payments).set({ feeCents: fee, updatedAt: now }).where(eq(payments.id, e.paymentId));
      } catch (err) {
        console.error(`[earnings] Stripe fee lookup failed for ${e.providerTxId}`, err);
      }
    }

    const earned = storeEarning(e.grossCents, e.shareRateBps);
    const [updated] = await db
      .update(ownerEarnings)
      .set({ status: "available", feeCents: earned.feeCents, amountCents: earned.netCents, releasedAt: now, updatedAt: now })
      .where(and(eq(ownerEarnings.id, e.id), eq(ownerEarnings.status, "pending")))
      .returning({ id: ownerEarnings.id });
    if (!updated) continue;
    released++;
    const lines = releasedByOwner.get(e.ownerId) ?? [];
    lines.push({ adTitle: e.adTitle, adPriceCents: e.grossCents, shareRateBps: e.shareRateBps, ...earned });
    releasedByOwner.set(e.ownerId, lines);
  }

  for (const [ownerId, lines] of releasedByOwner) {
    await notifyEarningsAvailable(ownerId, lines);
  }

  return { released, voided: voided.length };
}

/** Available balance per owner, for the admin Payouts screen. */
export async function availableBalances() {
  return db
    .select({
      ownerId:     ownerEarnings.ownerId,
      totalCents:  sql<number>`sum(${ownerEarnings.amountCents})::int`,
      count:       sql<number>`count(*)::int`,
    })
    .from(ownerEarnings)
    .where(eq(ownerEarnings.status, "available"))
    .groupBy(ownerEarnings.ownerId);
}
