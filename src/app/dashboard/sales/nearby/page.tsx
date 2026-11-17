import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { cities, locations, states } from "@/lib/db/schema";
import { placesConfigured } from "@/lib/nearby-places";
import NearbyClient from "./NearbyClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find nearby businesses" };

// Sales: find businesses within a mile of a store (Google Places) and add the good ones as advertiser leads
export default async function NearbyPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  await requireAdmin();
  const stores = await db
    .select({
      id: locations.id, storeName: locations.storeName, storeNumber: locations.storeNumber,
      street: locations.addressLine1, city: cities.name, state: states.code,
    })
    .from(locations)
    .leftJoin(cities, eq(locations.cityId, cities.id))
    .leftJoin(states, eq(locations.stateId, states.id))
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.storeName));
  const { store } = await searchParams;
  return (
    <NearbyClient
      stores={stores.map((s) => {
        const name = s.storeNumber ? `${s.storeName} #${s.storeNumber.replace(/^#/, "")}` : s.storeName;
        const address = [s.street, s.city, s.state].map((v) => v?.trim()).filter(Boolean).join(", ");
        // "Fast Eddies #Store-1 — 11801 Hwy 99, Everett, WA" in the dropdown
        return { id: s.id, label: address ? `${name} — ${address}` : name };
      })}
      initialStore={stores.some((s) => s.id === store) ? store! : stores[0]?.id ?? ""}
      configured={placesConfigured()}
    />
  );
}
