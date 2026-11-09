import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { locations, cities, states } from "@/lib/db/schema";

// A store counts as "new" on the home page for this long after it was added
export const NEW_STORE_DAYS = 14;

export type NetworkStore = {
  id: string; slug: string; name: string; city: string; stateCode: string; address: string;
  priceCents: number; dailyCustomers: number | null; isNew: boolean;
};

export type StoreNetwork = {
  stores: NetworkStore[];       // active stores, newest first
  cities: string[];             // distinct cities, most stores first
  dailyShoppers: number;        // sum of store-reported daily customers (stores that have a count)
  storesWithCounts: number;     // how many stores that sum covers
};

/** Every active store, for the home page's network numbers and store strip, and the /stores page. */
export async function getStoreNetwork(): Promise<StoreNetwork> {
  try {
    const rows = await db
      .select({
        id: locations.id, slug: locations.slug, displayName: locations.displayName, storeName: locations.storeName,
        addressLine1: locations.addressLine1, addressLine2: locations.addressLine2, priceCents: locations.pricePerRunCents,
        city: cities.name, stateCode: states.code, dailyCustomers: locations.dailyCustomers, createdAt: locations.createdAt,
      })
      .from(locations)
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .where(eq(locations.isActive, true))
      .orderBy(asc(locations.createdAt));

    const newSince = Date.now() - NEW_STORE_DAYS * 24 * 60 * 60 * 1000;
    const stores = rows
      .map(r => ({
        id: r.id,
        slug: r.slug,
        name: (r.displayName || r.storeName).trim(),
        city: r.city,
        stateCode: r.stateCode,
        address: [r.addressLine1, r.addressLine2].filter(Boolean).join(", "),
        priceCents: r.priceCents,
        dailyCustomers: r.dailyCustomers && r.dailyCustomers > 0 ? r.dailyCustomers : null,
        isNew: r.createdAt.getTime() >= newSince,
      }))
      .reverse();

    const perCity = new Map<string, number>();
    for (const s of stores) perCity.set(s.city, (perCity.get(s.city) ?? 0) + 1);
    const counted = stores.filter(s => s.dailyCustomers);

    return {
      stores,
      cities: [...perCity.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c),
      dailyShoppers: counted.reduce((sum, s) => sum + (s.dailyCustomers ?? 0), 0),
      storesWithCounts: counted.length,
    };
  } catch (err) {
    console.error("[network] getStoreNetwork failed", err);
    return { stores: [], cities: [], dailyShoppers: 0, storesWithCounts: 0 };
  }
}

/** "Everett", "Everett & Marysville", "Everett, Marysville & Lynnwood", "5 cities" */
export function formatCities(list: string[]) {
  if (list.length <= 1) return list[0] ?? "";
  if (list.length === 2) return `${list[0]} & ${list[1]}`;
  if (list.length === 3) return `${list[0]}, ${list[1]} & ${list[2]}`;
  return `${list.length} cities`;
}
