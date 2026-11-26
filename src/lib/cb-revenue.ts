import { and, desc, eq, ne, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, locations, ownerEarnings, payments, users } from "@/lib/db/schema";
import { cbEarning, type CbEarning } from "@/lib/cb-earning";
import { storeEarning } from "@/lib/store-earning";

export type CbRevenueRow = {
  paymentId: string;
  paidAt: string;
  adId: string;
  adTitle: string;
  storeName: string;
  storeNumber: string | null;
  ownStore: boolean;            // our own store (admin-owned): no store share
  shareRateBps: number;
  adPriceCents: number;
  taxCents: number;
  taxRateBps: number | null;
  taxAreaName: string | null;
  storeShareCents: number;
  storeFeeCents: number;
  storeNetCents: number;
  storeStatus: string | null;   // earnings row status: pending / available / paid
  offline: { cents: number; method: string | null; paidOn: string | null; note: string | null } | null;  // paid outside the system
  cb: CbEarning;
};

/** Paid ads (refunds left out) with what the store gets and what Community Bulletin keeps, newest first */
export async function loadCbRevenue(where?: SQL) {
  const rows = await db
    .select({
      paymentId: payments.id,
      paidAt: payments.createdAt,
      amountCents: payments.amountCents,
      taxCents: payments.taxCents,
      taxRateBps: payments.taxRateBps,
      taxAreaName: payments.taxAreaName,
      stripeFeeCents: payments.feeCents,
      offlineCents: payments.offlineStorePaidCents,
      offlineMethod: payments.offlineStorePaidMethod,
      offlineOn: payments.offlineStorePaidOn,
      offlineNote: payments.offlineStorePaidNote,
      adId: ads.id,
      adTitle: ads.title,
      storeName: locations.storeName,
      storeNumber: locations.storeNumber,
      ownerRole: users.role,
      earningStatus: ownerEarnings.status,
      earningGross: ownerEarnings.grossCents,
      earningBps: ownerEarnings.shareRateBps,
      earningAmount: ownerEarnings.amountCents,
    })
    .from(payments)
    .innerJoin(ads, eq(payments.adId, ads.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(users, eq(locations.storeOwnerId, users.id))
    .leftJoin(ownerEarnings, and(eq(ownerEarnings.paymentId, payments.id), ne(ownerEarnings.status, "void")))
    .where(where ? and(eq(payments.status, "paid"), where) : eq(payments.status, "paid"))
    .orderBy(desc(payments.createdAt));

  return rows.map((r): CbRevenueRow => {
    const adPriceCents = r.amountCents - r.taxCents;
    const hasShare = r.earningStatus !== null;
    const bps = r.earningBps ?? 0;
    const formula = storeEarning(r.earningGross ?? adPriceCents, bps);
    // Released earnings: the amount actually credited (older ones used the earlier fee formula).
    // Plus anything paid to the store outside the system (cash, Zelle, check), with no card fee taken.
    const offlineCents = r.offlineCents ?? 0;
    const storeShareCents = (hasShare ? formula.shareCents : 0) + offlineCents;
    const storeNetCents = (hasShare ? (r.earningAmount ?? formula.netCents) : 0) + offlineCents;
    const storeFeeCents = storeShareCents - storeNetCents;
    return {
      paymentId: r.paymentId,
      paidAt: r.paidAt.toISOString(),
      adId: r.adId,
      adTitle: r.adTitle,
      storeName: r.storeName,
      storeNumber: r.storeNumber,
      ownStore: !hasShare && !offlineCents && r.ownerRole === "admin",
      shareRateBps: bps,
      adPriceCents,
      taxCents: r.taxCents,
      taxRateBps: r.taxRateBps,
      taxAreaName: r.taxAreaName,
      storeShareCents,
      storeFeeCents,
      storeNetCents,
      storeStatus: r.earningStatus,
      offline: r.offlineCents ? { cents: r.offlineCents, method: r.offlineMethod, paidOn: r.offlineOn, note: r.offlineNote } : null,
      cb: cbEarning({ adPriceCents, taxCents: r.taxCents, storeShareCents, storeFeeCents, stripeFeeCents: r.stripeFeeCents }),
    };
  });
}

/** Totals for a list of rows */
export function sumCbRevenue(rows: CbRevenueRow[]) {
  const s = (f: (r: CbRevenueRow) => number) => rows.reduce((a, r) => a + f(r), 0);
  return {
    count: rows.length,
    adSalesCents: s((r) => r.adPriceCents),
    taxCents: s((r) => r.taxCents),
    storeNetCents: s((r) => r.storeNetCents),
    stripeFeeCents: s((r) => r.cb.stripeTotalCents),
    ourFeeCents: s((r) => r.cb.ourFeeCents),
    keepsCents: s((r) => r.cb.keepsCents),
    estimated: rows.some((r) => r.cb.estimated),
  };
}

/** Payment month in Pacific time, "2026-11" */
export const paymentMonth = sql<string>`to_char(${payments.createdAt} at time zone 'UTC' at time zone 'America/Los_Angeles', 'YYYY-MM')`;
