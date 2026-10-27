import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users, ownerEarnings, payouts } from "@/lib/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import PayoutsClient, { type OwnerBalance, type PayoutRow } from "./PayoutsClient";
import { stripeConnectEnabled, stripeTestMode } from "@/lib/stripe";
import { lastDirectDepositRun } from "@/lib/direct-deposits";

export default async function AdminPayoutsPage() {
  await requireAdmin();

  // Per-owner totals by status (amounts for pending rows are estimates before fees)
  const totals = await db
    .select({
      ownerId: ownerEarnings.ownerId,
      availableCents: sql<number>`coalesce(sum(${ownerEarnings.amountCents}) filter (where ${ownerEarnings.status} = 'available'), 0)::int`,
      availableCount: sql<number>`(count(*) filter (where ${ownerEarnings.status} = 'available'))::int`,
      pendingCents:   sql<number>`coalesce(sum(${ownerEarnings.grossCents} * ${ownerEarnings.shareRateBps} / 10000) filter (where ${ownerEarnings.status} = 'pending'), 0)::int`,
      pendingCount:   sql<number>`(count(*) filter (where ${ownerEarnings.status} = 'pending'))::int`,
    })
    .from(ownerEarnings)
    .groupBy(ownerEarnings.ownerId);
  const totalsMap = new Map(totals.map(t => [t.ownerId, t]));

  const owners = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      payoutMethod: users.payoutMethod,
      payoutZelle: users.payoutZelle,
      payoutMailingAddress: users.payoutMailingAddress,
      agreementStatus: users.partnerAgreementStatus,
      stripeAccountId: users.stripeAccountId,
      stripePayoutsEnabled: users.stripePayoutsEnabled,
      manualPayoutAllowed: users.manualPayoutAllowed,
    })
    .from(users)
    .where(inArray(users.role, ["store_owner"]))
    .orderBy(users.name);

  const balances: OwnerBalance[] = owners.map(o => {
    const t = totalsMap.get(o.id);
    return {
      ...o,
      availableCents: t?.availableCents ?? 0,
      availableCount: t?.availableCount ?? 0,
      pendingCents:   t?.pendingCents ?? 0,
      pendingCount:   t?.pendingCount ?? 0,
    };
  }).sort((a, b) => b.availableCents - a.availableCents);

  const history: PayoutRow[] = (await db
    .select({
      id: payouts.id,
      ownerName: users.name,
      amountCents: payouts.amountCents,
      method: payouts.method,
      reference: payouts.reference,
      note: payouts.note,
      paidAt: payouts.paidAt,
    })
    .from(payouts)
    .innerJoin(users, eq(payouts.ownerId, users.id))
    .orderBy(desc(payouts.paidAt))
    .limit(50)
  ).map(p => ({ ...p, paidAt: p.paidAt.toISOString() }));

  const connectEnabled = stripeConnectEnabled();
  return (
    <PayoutsClient
      balances={balances}
      history={history}
      directDeposits={connectEnabled ? { testMode: stripeTestMode(), lastRun: await lastDirectDepositRun() } : null}
    />
  );
}
