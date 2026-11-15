import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { placesConfigured } from "@/lib/nearby-places";
import NearbyClient from "./NearbyClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find nearby businesses" };

// Sales: find businesses within a mile of a store (Google Places) and add the good ones as advertiser leads
export default async function NearbyPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  await requireAdmin();
  const stores = await db
    .select({ id: locations.id, storeName: locations.storeName, storeNumber: locations.storeNumber })
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.storeName));
  const { store } = await searchParams;
  return (
    <NearbyClient
      stores={stores.map((s) => ({ id: s.id, label: s.storeNumber ? `${s.storeName} #${s.storeNumber.replace(/^#/, "")}` : s.storeName }))}
      initialStore={stores.some((s) => s.id === store) ? store! : stores[0]?.id ?? ""}
      configured={placesConfigured()}
    />
  );
}
