import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations, payments, cities, states, postalCodes } from "@/lib/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { waCountyName } from "@/lib/sales-tax";
import TaxesClient, { type StoreTaxRow, type TaxReportRow } from "./TaxesClient";

export const dynamic = "force-dynamic";

// Payment dates in Pacific time, as "2026-Q4" (payments.created_at is stored in UTC)
const quarterOf = sql<string>`to_char(${payments.createdAt} at time zone 'UTC' at time zone 'America/Los_Angeles', 'YYYY-"Q"Q')`;

function currentQuarter() {
  const pt = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return `${pt.getFullYear()}-Q${Math.floor(pt.getMonth() / 3) + 1}`;
}

export default async function AdminTaxesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const asked = (await searchParams).q;
  const quarter = asked && /^\d{4}-Q[1-4]$/.test(asked) ? asked : currentQuarter();

  const stores: StoreTaxRow[] = (await db
    .select({
      id: locations.id,
      storeName: locations.storeName,
      storeNumber: locations.storeNumber,
      street: locations.addressLine1,
      city: cities.name,
      state: states.code,
      zip: postalCodes.code,
      isActive: locations.isActive,
      priceCents: locations.pricePerRunCents,
      taxRateBps: locations.taxRateBps,
      taxLocationCode: locations.taxLocationCode,
      taxAreaName: locations.taxAreaName,
      taxRatePeriod: locations.taxRatePeriod,
      taxRateCheckedAt: locations.taxRateCheckedAt,
    })
    .from(locations)
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .orderBy(asc(locations.taxLocationCode), asc(locations.storeName))
  ).map((s) => ({ ...s, county: waCountyName(s.taxLocationCode), taxRateCheckedAt: s.taxRateCheckedAt?.toISOString() ?? null }));

  // Paid ads in the quarter, by taxing area (refunded payments are left out: the sale was undone)
  const report: TaxReportRow[] = (await db
    .select({
      locationCode: payments.taxLocationCode,
      areaName: payments.taxAreaName,
      rateBps: payments.taxRateBps,
      payments: sql<number>`count(*)::int`,
      salesCents: sql<number>`coalesce(sum(${payments.amountCents} - ${payments.taxCents}), 0)::int`,
      taxCents: sql<number>`coalesce(sum(${payments.taxCents}), 0)::int`,
    })
    .from(payments)
    .where(sql`${payments.status} = 'paid' and ${quarterOf} = ${quarter}`)
    .groupBy(payments.taxLocationCode, payments.taxAreaName, payments.taxRateBps)
    .orderBy(asc(payments.taxLocationCode))
  ).map((r) => ({ ...r, county: waCountyName(r.locationCode) }));

  const quarters = (await db
    .selectDistinct({ q: quarterOf })
    .from(payments)
  ).map((r) => r.q);
  const allQuarters = [...new Set([currentQuarter(), quarter, ...quarters])].sort().reverse();

  return (
    <div className="max-w-[1100px]">
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Sales Tax</h1>
      <p className="text-sm text-[#4A6B82] mb-5">
        Washington taxes advertising as a retail sale (since Oct 1, 2025). Ads are taxed where they&apos;re shown, so each
        store has the rate for its own address from the WA Department of Revenue. Customers pay the ad price plus that
        tax at checkout. Store shares and revenue are figured on the price before tax.
      </p>
      <TaxesClient stores={stores} report={report} quarter={quarter} quarters={allQuarters} />
    </div>
  );
}
