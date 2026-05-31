import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { pushDisplayRefresh } from "@/lib/socket/notify";

const schema = z.object({ slug: z.string().min(1) });

// POST /api/admin/display/refresh — force-push ads:refresh to a display screen
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { slug } = schema.parse(body);
    await pushDisplayRefresh(slug);
    console.log(`[Admin] Force-refreshed display:${slug}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    console.error("[POST /api/admin/display/refresh]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
