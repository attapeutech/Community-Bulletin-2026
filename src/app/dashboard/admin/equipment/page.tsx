import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { equipment, equipmentPhotos, locations, locationSetup, screenDevices } from "@/lib/db/schema";
import { asc, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import EquipmentClient, { type EquipmentRow } from "./EquipmentClient";
import StoreSetupClient, { type StoreSetupRow } from "./StoreSetupClient";

export const dynamic = "force-dynamic";

const ONLINE_MS = 3 * 60_000;

export default async function AdminEquipmentPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const tab = (await searchParams).tab === "items" ? "items" : "setup";
  const now = Date.now();

  const locationOptions = await db
    .select({ id: locations.id, storeName: locations.storeName, storeNumber: locations.storeNumber, slug: locations.slug })
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.storeName));

  // Screens assigned to a store (online status, and for linking a mini computer to its screen)
  const screens = await db
    .select({ id: screenDevices.id, label: screenDevices.label, locationId: screenDevices.locationId, locationName: locations.storeName, lastSeenAt: screenDevices.lastSeenAt })
    .from(screenDevices)
    .innerJoin(locations, eq(screenDevices.locationId, locations.id))
    .where(isNotNull(screenDevices.locationId))
    .orderBy(asc(locations.storeName));

  let body: React.ReactNode;
  if (tab === "setup") {
    const setups = await db
      .select({
        locationId: locationSetup.locationId,
        wifiName: locationSetup.wifiName,
        wifiPasswordEnc: locationSetup.wifiPasswordEnc,
        contactName: locationSetup.contactName,
        contactPhone: locationSetup.contactPhone,
        networkNotes: locationSetup.networkNotes,
        checklist: locationSetup.checklist,
      })
      .from(locationSetup);
    const items = await db.select({ locationId: equipment.locationId }).from(equipment).where(ne(equipment.status, "retired"));

    const stores: StoreSetupRow[] = locationOptions.map((l) => {
      const s = setups.find((x) => x.locationId === l.id);
      const mine = screens.filter((sc) => sc.locationId === l.id);
      return {
        locationId: l.id,
        storeName: l.storeName,
        storeNumber: l.storeNumber,
        slug: l.slug,
        wifiName: s?.wifiName ?? null,
        hasPassword: !!s?.wifiPasswordEnc, // the password itself never goes to the page
        contactName: s?.contactName ?? null,
        contactPhone: s?.contactPhone ?? null,
        networkNotes: s?.networkNotes ?? null,
        checklist: s?.checklist ?? {},
        equipmentCount: items.filter((i) => i.locationId === l.id).length,
        screenCount: mine.length,
        onlineScreens: mine.filter((sc) => now - sc.lastSeenAt.getTime() < ONLINE_MS).length,
      };
    });
    body = <StoreSetupClient stores={stores} />;
  } else {
    const rows = await db
      .select({
        id: equipment.id,
        locationId: equipment.locationId,
        locationName: locations.storeName,
        type: equipment.type,
        status: equipment.status,
        label: equipment.label,
        brand: equipment.brand,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        screenDeviceId: equipment.screenDeviceId,
        screenLabel: screenDevices.label,
        screenLastSeenAt: screenDevices.lastSeenAt,
        purchasedOn: equipment.purchasedOn,
        costCents: equipment.costCents,
        notes: equipment.notes,
        remoteAccount: equipment.remoteAccount,
        remoteUrl: equipment.remoteUrl,
        remoteComputerName: equipment.remoteComputerName,
        windowsUser: equipment.windowsUser,
        // Only whether a secret is saved; the values come from the "Show" button
        hasRemotePassword: sql<boolean>`${equipment.remoteAccountPasswordEnc} is not null`,
        hasRemotePin: sql<boolean>`${equipment.remotePinEnc} is not null`,
        hasWindowsPassword: sql<boolean>`${equipment.windowsPasswordEnc} is not null`,
        updatedAt: equipment.updatedAt,
      })
      .from(equipment)
      .leftJoin(locations, eq(equipment.locationId, locations.id))
      .leftJoin(screenDevices, eq(equipment.screenDeviceId, screenDevices.id))
      .orderBy(asc(locations.storeName), asc(equipment.type), desc(equipment.updatedAt));

    // Photo ids per item, oldest first (the images load through an admin-only link)
    const photos = await db.select({ id: equipmentPhotos.id, equipmentId: equipmentPhotos.equipmentId })
      .from(equipmentPhotos).orderBy(asc(equipmentPhotos.createdAt));
    const items: EquipmentRow[] = rows.map((r) => ({
      ...r,
      photoIds: photos.filter((p) => p.equipmentId === r.id).map((p) => p.id),
      screenLastSeenAt: r.screenLastSeenAt?.toISOString() ?? null,
      updatedAt: r.updatedAt.toISOString(),
    }));
    body = (
      <EquipmentClient
        items={items}
        locations={locationOptions.map(({ slug: _slug, ...l }) => l)}
        screens={screens.map(({ lastSeenAt: _seen, ...s }) => s)}
        nowIso={new Date(now).toISOString()}
      />
    );
  }

  const tabCls = (active: boolean) =>
    `no-underline px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
      active ? "border-[#E8563A] text-[#1A3A5C]" : "border-transparent text-[#4A6B82] hover:text-[#1A3A5C]"
    }`;

  return (
    <div className="max-w-[1100px]">
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Equipment</h1>
      <p className="text-sm text-[#4A6B82] mb-4">
        Each store&apos;s setup checklist and WiFi details, and the gear (mini computers, TVs, cables) at each store. Link a
        mini computer to its screen (from <a href="/dashboard/admin/screens" className="text-[#4A90C4] hover:underline">Screens</a>)
        to see whether it&apos;s online.
      </p>
      <div className="flex gap-1 border-b border-[#D8E4EE] mb-5">
        <Link href="/dashboard/admin/equipment" className={tabCls(tab === "setup")}>Store setup</Link>
        <Link href="/dashboard/admin/equipment?tab=items" className={tabCls(tab === "items")}>Equipment list</Link>
      </div>
      {body}
    </div>
  );
}
