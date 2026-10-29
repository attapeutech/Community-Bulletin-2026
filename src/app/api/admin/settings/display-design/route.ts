import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getDisplayDesign, saveDisplayDesign } from "@/lib/settings";
import { pushDisplayRefresh } from "@/lib/socket/notify";
import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({ design: z.enum(["classic", "brand"]) });

// GET /api/admin/settings/display-design
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ success: true, data: { design: await getDisplayDesign() } });
  } catch (error: any) {
    console.error("[GET /api/admin/settings/display-design]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/settings/display-design — switches every display screen's design and refreshes them
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    await saveDisplayDesign(parsed.data.design);

    const active = await db.select({ slug: locations.slug }).from(locations).where(eq(locations.isActive, true));
    for (const loc of active) pushDisplayRefresh(loc.slug).catch(console.error);
    pushDisplayRefresh("all").catch(console.error);

    return NextResponse.json({ success: true, data: parsed.data });
  } catch (error: any) {
    console.error("[PUT /api/admin/settings/display-design]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
