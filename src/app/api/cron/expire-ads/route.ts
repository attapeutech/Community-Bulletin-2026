import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { eq, and, lt, inArray } from "drizzle-orm";
import { pushDisplayRefresh } from "@/lib/socket/notify";

// POST /api/cron/expire-ads
// Called by Coolify scheduled task:
//   curl -X POST https://communitybulletin.com/api/cron/expire-ads \
//        -H "Authorization: Bearer $CRON_SECRET"
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/expire-ads] CRON_SECRET env var not set");
    return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all approved ads whose run window has ended
  const expired = await db
    .select({ id: ads.id, locationId: ads.locationId })
    .from(ads)
    .where(and(eq(ads.status, "approved"), lt(ads.endedAt, now)));

  if (expired.length === 0) {
    return NextResponse.json({ success: true, expired: 0 });
  }

  const adIds = expired.map(a => a.id);
  const locationIds = [...new Set(expired.map(a => a.locationId))];

  // Mark ads as expired
  await db
    .update(ads)
    .set({ status: "expired", updatedAt: now })
    .where(inArray(ads.id, adIds));

  // Push display refresh for each affected location
  const affectedLocations = await db
    .select({ slug: locations.slug })
    .from(locations)
    .where(inArray(locations.id, locationIds));

  for (const loc of affectedLocations) {
    pushDisplayRefresh(loc.slug);
  }

  console.log(`[cron/expire-ads] Expired ${adIds.length} ad(s) across ${affectedLocations.length} location(s)`);
  return NextResponse.json({ success: true, expired: adIds.length, locations: affectedLocations.map(l => l.slug) });
}
