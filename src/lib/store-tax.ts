import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { locations, cities, states, postalCodes } from "@/lib/db/schema";
import { lookupWaTaxRate } from "@/lib/sales-tax";

export type StoreTaxResult =
  | { ok: true; locationId: string; storeName: string; rateBps: number; areaName: string; locationCode: string }
  | { ok: false; locationId: string; storeName: string; error: string };

/**
 * Looks up the store's sales tax rate from the WA Department of Revenue by its street address and saves it.
 * Only Washington stores are looked up (other states: no tax set up yet). A failed lookup keeps the old rate.
 */
export async function refreshStoreTaxRate(locationId: string): Promise<StoreTaxResult> {
  const [row] = await db
    .select({
      id: locations.id,
      storeName: locations.storeName,
      street: locations.addressLine1,
      city: cities.name,
      state: states.code,
      zip: postalCodes.code,
    })
    .from(locations)
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(eq(locations.id, locationId))
    .limit(1);
  if (!row) return { ok: false, locationId, storeName: "", error: "Store not found" };
  if (row.state !== "WA") return { ok: false, locationId, storeName: row.storeName, error: `Only Washington stores are looked up (this one is in ${row.state})` };

  try {
    const rate = await lookupWaTaxRate({ street: row.street, city: row.city, zip: row.zip });
    if (!rate) return { ok: false, locationId, storeName: row.storeName, error: "WA DOR couldn't find this address. Check the street and ZIP, or enter the rate by hand." };
    await db.update(locations).set({
      taxRateBps: rate.rateBps,
      taxLocationCode: rate.locationCode,
      taxAreaName: rate.areaName,
      taxRatePeriod: rate.period,
      taxRateCheckedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(locations.id, locationId));
    return { ok: true, locationId, storeName: row.storeName, rateBps: rate.rateBps, areaName: rate.areaName, locationCode: rate.locationCode };
  } catch (err) {
    console.error(`[store-tax] lookup failed for ${locationId}`, err);
    return { ok: false, locationId, storeName: row.storeName, error: "Couldn't reach WA DOR. Try again in a minute." };
  }
}

/** Every store, one after another (DOR's lookup is a small public service) */
export async function refreshAllStoreTaxRates() {
  const all = await db.select({ id: locations.id }).from(locations);
  const results: StoreTaxResult[] = [];
  for (const l of all) results.push(await refreshStoreTaxRate(l.id));
  return results;
}
