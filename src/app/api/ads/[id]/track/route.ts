import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

// Public — display screens are never logged in.
// Body: { event: "view", location: "<store slug>" }  → one time the ad was shown on that store's screen
//       { event: "website_click" }                   → a click on the ad's website link

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ignore repeats of the same event for the same ad from the same client within this window
// (slides change every 8 s, so a genuine repeat can't be faster)
const REPEAT_WINDOW_MS = 5000;
const recent = new Map<string, number>();

function isRepeat(key: string) {
  const now = Date.now();
  const last = recent.get(key);
  recent.set(key, now);
  if (recent.size > 10_000) {
    for (const [k, t] of recent) if (now - t > REPEAT_WINDOW_MS) recent.delete(k);
  }
  return last !== undefined && now - last < REPEAT_WINDOW_MS;
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
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
      if (!slug) return NextResponse.json({ success: false, error: "Missing location" }, { status: 400 });
      if (isRepeat(`view:${ip}:${slug}:${id}`)) return NextResponse.json({ success: true, counted: false });

      // Count only ads that are approved, currently running, and booked at this screen's store
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
        ))
        .returning({ id: ads.id });
      return NextResponse.json({ success: true, counted: result.length > 0 });
    }

    if (event === "website_click") {
      if (isRepeat(`click:${ip}:${id}`)) return NextResponse.json({ success: true, counted: false });
      await db
        .update(ads)
        .set({ websiteClickCount: sql`${ads.websiteClickCount} + 1` })
        .where(eq(ads.id, id));
      return NextResponse.json({ success: true, counted: true });
    }

    return NextResponse.json({ success: false, error: "Unknown event" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/ads/[id]/track]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
