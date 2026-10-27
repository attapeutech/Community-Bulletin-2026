import { db } from "@/lib/db/client";
import { users, ownerEarnings, payouts, appSettings } from "@/lib/db/schema";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { MIN_PAYOUT_CENTS } from "@/types";
import { notifyPayoutSent } from "@/lib/notifications";
import { sendPayoutSentEmail, sendDirectDepositSummaryEmail } from "@/lib/email/templates";

// Phase 2: store owners are paid their available balance by direct deposit through Stripe Connect
// (Express accounts). Same ledger as manual payouts; each owner is paid at most once per month.

export const PAYOUT_DAY = 15;            // automatic runs start on the 15th (local time below)
const PAYOUT_TZ = "America/Los_Angeles";
const LAST_RUN_KEY = "direct_deposit_last_run";

export type DirectDepositStatus = "not_set_up" | "incomplete" | "active";

export function directDepositStatus(u: { stripeAccountId: string | null; stripePayoutsEnabled: boolean }): DirectDepositStatus {
  if (!u.stripeAccountId) return "not_set_up";
  return u.stripePayoutsEnabled ? "active" : "incomplete";
}

/** "2026-11" in Pacific time — the month a payout belongs to */
export function payoutPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: PAYOUT_TZ, year: "numeric", month: "2-digit" }).formatToParts(now);
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
}

/** Day of the month in Pacific time */
export function payoutDayOfMonth(now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: PAYOUT_TZ, day: "numeric" }).format(now));
}

/** Copy an Express account's onboarding state from Stripe onto the owner (webhook + page loads) */
export async function syncConnectAccount(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  const flags = {
    stripeDetailsSubmitted: !!account.details_submitted,
    stripePayoutsEnabled: !!account.payouts_enabled,
  };
  await db.update(users).set({ ...flags, updatedAt: new Date() }).where(eq(users.stripeAccountId, accountId));
  return flags;
}

export type RunLine = { ownerId: string; name: string; amountCents: number; reason?: string; transferId?: string };
export type RunSummary = {
  at: string;
  period: string;
  trigger: "schedule" | "manual";
  paid: RunLine[];
  skipped: RunLine[];
  failed: RunLine[];
};

class Skip extends Error {}

/**
 * Pay every eligible store owner their full available balance by Stripe transfer.
 * Safe to run any number of times: an owner already paid this month is skipped, and the
 * Stripe transfer is keyed to owner + month so it can never be sent twice.
 */
export async function runDirectDeposits({ now = new Date(), trigger, adminId = null }: {
  now?: Date; trigger: "schedule" | "manual"; adminId?: string | null;
}): Promise<RunSummary> {
  const period = payoutPeriod(now);
  const summary: RunSummary = { at: now.toISOString(), period, trigger, paid: [], skipped: [], failed: [] };

  const balances = await db
    .select({
      ownerId: ownerEarnings.ownerId,
      cents: sql<number>`coalesce(sum(${ownerEarnings.amountCents}), 0)::int`,
    })
    .from(ownerEarnings)
    .where(eq(ownerEarnings.status, "available"))
    .groupBy(ownerEarnings.ownerId);
  const owed = balances.filter(b => b.cents > 0);
  if (!owed.length) return saveRun(summary);

  const owners = await db
    .select({
      id: users.id, name: users.name, email: users.email,
      stripeAccountId: users.stripeAccountId, stripePayoutsEnabled: users.stripePayoutsEnabled,
      manualPayoutAllowed: users.manualPayoutAllowed, agreement: users.partnerAgreementStatus,
    })
    .from(users)
    .where(inArray(users.id, owed.map(b => b.ownerId)));
  const ownerMap = new Map(owners.map(o => [o.id, o]));

  const paidThisMonth = new Set((await db
    .select({ ownerId: payouts.ownerId })
    .from(payouts)
    .where(and(eq(payouts.period, period), isNotNull(payouts.period)))).map(p => p.ownerId));

  // Money we can send right now (USD available balance on our Stripe account)
  let remaining = 0;
  try {
    const bal = await stripe.balance.retrieve();
    remaining = bal.available.filter(a => a.currency === "usd").reduce((s, a) => s + a.amount, 0);
  } catch (err) {
    console.error("[direct-deposits] balance lookup failed", err);
  }

  for (const b of owed) {
    const o = ownerMap.get(b.ownerId);
    if (!o) continue;
    const line: RunLine = { ownerId: o.id, name: o.name, amountCents: b.cents };
    const skip = (reason: string) => summary.skipped.push({ ...line, reason });

    if (o.manualPayoutAllowed) { skip("Paid by Zelle or check (exception)"); continue; }
    if (directDepositStatus(o) === "not_set_up") { skip("Direct deposit not set up"); continue; }
    if (directDepositStatus(o) === "incomplete") { skip("Direct deposit setup not finished"); continue; }
    if (o.agreement === "not_sent" || o.agreement === "sent") { skip("Agreement not signed yet"); continue; }
    if (paidThisMonth.has(o.id)) { skip("Already paid this month"); continue; }
    if (b.cents < MIN_PAYOUT_CENTS) { skip(`Below the $${MIN_PAYOUT_CENTS / 100} minimum`); continue; }
    if (b.cents > remaining) { skip("Not enough in our Stripe balance; waits for the next run"); continue; }

    const group = `dd_${o.id}_${period}`;
    try {
      const result = await db.transaction(async (tx) => {
        const rows = await tx
          .select({ id: ownerEarnings.id, amountCents: ownerEarnings.amountCents })
          .from(ownerEarnings)
          .where(and(eq(ownerEarnings.ownerId, o.id), eq(ownerEarnings.status, "available")))
          .for("update");
        const total = rows.reduce((s, r) => s + (r.amountCents ?? 0), 0);
        if (total < MIN_PAYOUT_CENTS) throw new Skip("Balance changed during the run");

        const [payout] = await tx
          .insert(payouts)
          .values({ ownerId: o.id, amountCents: total, currency: "USD", method: "stripe", period, createdBy: adminId })
          .onConflictDoNothing()
          .returning({ id: payouts.id });
        if (!payout) throw new Skip("Already paid this month");

        await tx
          .update(ownerEarnings)
          .set({ status: "paid", payoutId: payout.id, updatedAt: new Date() })
          .where(inArray(ownerEarnings.id, rows.map(r => r.id)));

        // If an earlier attempt already reached Stripe (e.g. it crashed before saving), reuse that transfer
        const earlier = (await stripe.transfers.list({ transfer_group: group, limit: 1 })).data[0];
        if (earlier && earlier.amount !== total) {
          throw new Error(`A ${earlier.amount / 100} USD transfer for this month already exists in Stripe (${earlier.id}); check before paying again`);
        }
        const transfer = earlier ?? await stripe.transfers.create({
          amount: total,
          currency: "usd",
          destination: o.stripeAccountId!,
          transfer_group: group,
          description: `CommunityBulletin store earnings ${period}`,
          metadata: { ownerId: o.id, period, payoutId: payout.id },
        }, { idempotencyKey: group });

        await tx.update(payouts).set({ reference: transfer.id }).where(eq(payouts.id, payout.id));
        return { total, count: rows.length, transferId: transfer.id };
      });

      remaining -= result.total;
      summary.paid.push({ ...line, amountCents: result.total, transferId: result.transferId });
      await notifyPayoutSent(o.id, result.total, "stripe");
      sendPayoutSentEmail({
        to: o.email, ownerName: o.name, amountFormatted: `$${(result.total / 100).toFixed(2)}`,
        method: "stripe", reference: null, adCount: result.count,
      }).catch(console.error);
    } catch (err: any) {
      if (err instanceof Skip) skip(err.message);
      else {
        console.error(`[direct-deposits] payout to ${o.id} failed`, err);
        summary.failed.push({ ...line, reason: err?.message ?? "Unknown error" });
      }
    }
  }

  await saveRun(summary);

  // Tell admins when something happened (quiet days, where everyone was already paid, send nothing)
  if (summary.paid.length || summary.failed.length) {
    const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, "admin"));
    for (const a of admins) sendDirectDepositSummaryEmail({ to: a.email, summary }).catch(console.error);
  }
  return summary;
}

async function saveRun(summary: RunSummary) {
  await db
    .insert(appSettings)
    .values({ key: LAST_RUN_KEY, value: summary, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: summary, updatedAt: new Date() } });
  return summary;
}

export async function lastDirectDepositRun(): Promise<RunSummary | null> {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, LAST_RUN_KEY)).limit(1);
  return (row?.value as RunSummary) ?? null;
}
