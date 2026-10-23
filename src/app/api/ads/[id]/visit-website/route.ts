import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/ads/[id]/visit-website — increments websiteClickCount then redirects
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch the website URL first
  const [ad] = await db
    .select({ contactWebsite: ads.contactWebsite })
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1);

  if (!ad?.contactWebsite) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Increment counter
  await db
    .update(ads)
    .set({ websiteClickCount: sql`${ads.websiteClickCount} + 1` })
    .where(eq(ads.id, id))
    .catch(() => {});

  const destination = ad.contactWebsite.startsWith("http")
    ? ad.contactWebsite
    : `https://${ad.contactWebsite}`;

  return NextResponse.redirect(destination);
}
