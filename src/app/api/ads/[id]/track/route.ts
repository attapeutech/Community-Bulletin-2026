import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations, screenDevices } from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { recordWebsiteVisit, clientIp, recordAdEvent } from "@/lib/click-tracking";

// Public — display screens are never logged in.
// Body: { event: "view", location: "<store slug>", device: "<screen device id>" }
//         → one time the ad was shown on a screen registered to that store (Admin → Screens)
//       { event: "call" }                            → a tap on Call on the QR page (/go/<id>/options)
//       { event: "website_click" }                   → a click on the ad's website link (see lib/click-tracking)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// At most one view per ad per screen per minute. A store with a single live ad shows it slide after
// slide (every ~10 s, 24/7), which counted ~450 "views" an hour; in a normal loop of several ads each ad
// comes round less often than this, so those counts are unchanged. (In memory: a restart forgets it.)
const REPEAT_WINDOW_MS = 60_000;
const recent = new Map<string, number>();

function isRepeat(key: string) {
  const now = Date.now();
  const last = recent.get(key);
  if (last !== undefined && now - last < REPEAT_WINDOW_MS) return true;
  // Only a counted view restarts the window (otherwise a lone ad would never count again)
  recent.set(key, now);
  if (recent.size > 10_000) {
    for (const [k, t] of recent) if (now - t > REPEAT_WINDOW_MS) recent.delete(k);
  }
  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) return NextResponse.json({ success: false, error: "Unknown ad" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const event = body?.event;
    const ip = clientIp(req);

    if (event === "view") {
      const slug = typeof body.location === "string" ? body.location : "";
      const device = typeof body.device === "string" ? body.device.slice(0, 64) : "";
      if (!slug) return NextResponse.json({ success: false, error: "Missing location" }, { status: 400 });
      // Only a store's registered screens count (Admin → Screens), not View Live tabs or other browsers
      if (!device) return NextResponse.json({ success: true, counted: false });
      if (isRepeat(`view:${device}:${slug}:${id}`)) return NextResponse.json({ success: true, counted: false });

      // Count only ads that are approved, currently running, and booked at this screen's store,
      // shown on a screen registered to that store
      const now = new Date();
      const result = await db
        .update(ads)
        .set({ viewCount: sql`${ads.viewCount} + 1` })
        .where(and(
          eq(ads.id, id),
          eq(ads.status, "approved"),
          lte(ads.startedAt, now),
          gte(ads.endedAt, now),
          sql`${ads.locationId} = (select ${locations.id} from ${locations} where ${locations.slug} = ${slug})`,
          sql`exists (select 1 from ${screenDevices} where ${screenDevices.id} = ${device} and ${screenDevices.locationId} = ${ads.locationId})`,
        ))
        .returning({ id: ads.id });
      return NextResponse.json({ success: true, counted: result.length > 0 });
    }

    // "Call" on the QR page (a tel: link, so the tap is reported separately)
    if (event === "call") {
      const counted = await recordAdEvent(req, id, "call");
      return NextResponse.json({ success: true, counted });
    }

    if (event === "website_click") {
      const counted = await recordWebsiteVisit(req, id);
      return NextResponse.json({ success: true, counted });
    }

    return NextResponse.json({ success: false, error: "Unknown event" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/ads/[id]/track]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
