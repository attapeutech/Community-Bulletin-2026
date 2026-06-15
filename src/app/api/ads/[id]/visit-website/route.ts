import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/ads/[id]/visit-website — increments websiteClickCount then redirects
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [ad] = await db
    .update(ads)
    .set({ websiteClickCount: sql`${ads.websiteClickCount} + 1` })
    .where(eq(ads.id, id))
    .returning({ contactWebsite: ads.contactWebsite });

  const url = ad?.contactWebsite;
  if (!url) {
    return NextResponse.json({ error: "No website configured" }, { status: 404 });
  }

  const destination = url.startsWith("http") ? url : `https://${url}`;
  return NextResponse.redirect(destination);
}
