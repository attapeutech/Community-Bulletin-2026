import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getAdvertiseSlideSettings, saveAdvertiseSlideSettings } from "@/lib/settings";
import { pushDisplayRefresh } from "@/lib/socket/notify";
import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  enabled: z.boolean(),
  headline: z.string().trim().min(3, "Headline is too short").max(60, "Keep the headline under 60 characters"),
  subline: z.string().trim().max(120, "Keep the sub-line under 120 characters"),
  everyNAds: z.number().int().min(1).max(20),
});

// GET /api/admin/settings/advertise-slide
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ success: true, data: await getAdvertiseSlideSettings() });
  } catch (error: any) {
    console.error("[GET /api/admin/settings/advertise-slide]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/settings/advertise-slide — saves and refreshes every display screen
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 422 }
      );
    }
    await saveAdvertiseSlideSettings(parsed.data);

    const active = await db.select({ slug: locations.slug }).from(locations).where(eq(locations.isActive, true));
    for (const loc of active) pushDisplayRefresh(loc.slug).catch(console.error);

    return NextResponse.json({ success: true, data: parsed.data });
  } catch (error: any) {
    console.error("[PUT /api/admin/settings/advertise-slide]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
