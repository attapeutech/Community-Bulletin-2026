import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { screenDevices, locations } from "@/lib/db/schema";
import { and, asc, desc, eq, gte, isNull, lt, or, isNotNull } from "drizzle-orm";
import ScreensClient, { type ScreenRow } from "./ScreensClient";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

export default async function AdminScreensPage() {
  await requireAdmin();
  const now = Date.now();

  // Forget unassigned browsers not seen for 30 days (mostly website visitors on Live Ads)
  await db.delete(screenDevices).where(and(
    isNull(screenDevices.locationId),
    lt(screenDevices.lastSeenAt, new Date(now - 30 * DAY_MS)),
  ));

  const rows = await db
    .select({
      id: screenDevices.id,
      ip: screenDevices.ip,
      userAgent: screenDevices.userAgent,
      currentPath: screenDevices.currentPath,
      label: screenDevices.label,
      locationId: screenDevices.locationId,
      locationName: locations.storeName,
      checkins: screenDevices.checkins,
      firstSeenAt: screenDevices.firstSeenAt,
      lastSeenAt: screenDevices.lastSeenAt,
    })
    .from(screenDevices)
    .leftJoin(locations, eq(screenDevices.locationId, locations.id))
    // Assigned screens always; others if seen in the last 7 days
    .where(or(isNotNull(screenDevices.locationId), gte(screenDevices.lastSeenAt, new Date(now - 7 * DAY_MS))))
    .orderBy(desc(screenDevices.lastSeenAt))
    .limit(200);

  const locationOptions = await db
    .select({ id: locations.id, storeName: locations.storeName, storeNumber: locations.storeNumber, slug: locations.slug })
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.storeName));

  const screens: ScreenRow[] = rows.map((r) => ({
    ...r,
    firstSeenAt: r.firstSeenAt.toISOString(),
    lastSeenAt: r.lastSeenAt.toISOString(),
  }));

  return (
    <div className="max-w-[1000px]">
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Screens</h1>
      <p className="text-sm text-[#4A6B82] mb-6">
        Browsers running a display screen check in about once a minute. Assign one to a location and it switches to that
        store&apos;s screen within a minute — no need to visit the store. A TV that&apos;s been on for hours shows a long
        &ldquo;On for&rdquo; time.
      </p>
      <ScreensClient screens={screens} locations={locationOptions} nowIso={new Date(now).toISOString()} />
    </div>
  );
}
