import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// POST /api/ads/[id]/track — public, no auth required (called from display screen)
// Body: { event: "view" | "website_click" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { event } = await req.json();

    if (event === "view") {
      await db
        .update(ads)
        .set({ viewCount: sql`${ads.viewCount} + 1` })
        .where(eq(ads.id, id));
    } else if (event === "website_click") {
      await db
        .update(ads)
        .set({ websiteClickCount: sql`${ads.websiteClickCount} + 1` })
        .where(eq(ads.id, id));
    } else {
      return NextResponse.json({ success: false, error: "Unknown event" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/ads/[id]/track]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
