import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { leadToday } from "@/lib/leads";
import { storeOptions } from "../store-options";
import NewLeadClient from "./NewLeadClient";

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const stores = storeOptions(await db
    .select({ id: locations.id, storeName: locations.storeName, storeNumber: locations.storeNumber })
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.storeName)));

  return (
    <NewLeadClient
      today={leadToday()}
      stores={stores}
      initialKind={sp.kind === "store_partner" ? "store_partner" : "advertiser"}
      initialLocationId={stores.some(s => s.id === sp.location) ? sp.location! : ""}
    />
  );
}
