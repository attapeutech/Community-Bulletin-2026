import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { screenDevices, locations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { clientIp, isBot } from "@/lib/click-tracking";

const bodySchema = z.object({
  deviceId: z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/),
  path: z.string().max(200),
});

// POST /api/display/screen/checkin — public: a display screen reports in (about once a minute)
// and learns which location it has been assigned to, if any.
export async function POST(req: NextRequest) {
  try {
    if (isBot(req)) return NextResponse.json({ success: true, data: { assignedSlug: null } });
    const { deviceId, path } = bodySchema.parse(await req.json());
    const now = new Date();
    const ip = clientIp(req);
    const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 300);

    await db
      .insert(screenDevices)
      .values({ id: deviceId, ip, userAgent, currentPath: path, firstSeenAt: now, lastSeenAt: now })
      .onConflictDoUpdate({
        target: screenDevices.id,
        set: { ip, userAgent, currentPath: path, lastSeenAt: now, checkins: sql`${screenDevices.checkins} + 1` },
      });

    const [row] = await db
      .select({ slug: locations.slug, isActive: locations.isActive })
      .from(screenDevices)
      .leftJoin(locations, eq(screenDevices.locationId, locations.id))
      .where(eq(screenDevices.id, deviceId))
      .limit(1);

    return NextResponse.json({ success: true, data: { assignedSlug: row?.isActive ? row.slug : null } });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 422 });
    }
    console.error("[POST /api/display/screen/checkin]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
