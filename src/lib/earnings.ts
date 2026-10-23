import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { ads, locations, payments, users, ownerEarnings } from "@/lib/db/schema";
import { eq, and, inArray, isNull, isNotNull, lte, or, sql } from "drizzle-orm";
import { notifyEarningsAvailable } from "@/lib/notifications";

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
      grossCents:   row.amountCents,
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

async function fetchStripeFeeCents(paymentIntentId: string): Promise<number | null> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge.balance_transaction"],
  });
  const charge = pi.latest_charge as Stripe.Charge | null;
  const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null | undefined;
  return bt && typeof bt === "object" ? bt.fee : null;
}

/**
 * Daily job: moves pending earnings to available once the ad run has ended
 * (or the ad was ended early), computing the owner's amount net of processor fees.
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
      paymentId:     payments.id,
      provider:      payments.provider,
      providerTxId:  payments.providerTxId,
      feeCents:      payments.feeCents,
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
  const failed: string[] = [];
  const releasedByOwner = new Map<string, { cents: number; count: number }>();

  for (const e of due) {
    let fee = e.feeCents;
    if (fee === null && e.provider === "stripe") {
      try {
        fee = await fetchStripeFeeCents(e.providerTxId);
        if (fee !== null) {
          await db.update(payments).set({ feeCents: fee, updatedAt: now }).where(eq(payments.id, e.paymentId));
        }
      } catch (err) {
        console.error(`[earnings] Stripe fee lookup failed for ${e.providerTxId}`, err);
      }
    }
    // Fee still unknown → leave pending and retry on the next run
    if (fee === null) {
      failed.push(e.id);
      continue;
    }

    const amountCents = Math.round(((e.grossCents - fee) * e.shareRateBps) / 10000);
    await db
      .update(ownerEarnings)
      .set({ status: "available", feeCents: fee, amountCents, releasedAt: now, updatedAt: now })
      .where(and(eq(ownerEarnings.id, e.id), eq(ownerEarnings.status, "pending")));
    released++;
    const t = releasedByOwner.get(e.ownerId) ?? { cents: 0, count: 0 };
    releasedByOwner.set(e.ownerId, { cents: t.cents + amountCents, count: t.count + 1 });
  }

  for (const [ownerId, t] of releasedByOwner) {
    await notifyEarningsAvailable(ownerId, t.cents, t.count);
  }

  return { released, voided: voided.length, retryLater: failed.length };
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
