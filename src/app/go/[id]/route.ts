import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /go/[id] — public short link used by display-screen QR codes.
// Counts the scan as a website click, then sends the visitor to the advertiser's site
// (or to the public ad page if the ad has no website).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (!UUID_RE.test(id)) {
    return NextResponse.redirect(new URL("/", base));
  }

  const [ad] = await db
    .select({ contactWebsite: ads.contactWebsite })
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1);

  if (!ad) {
    return NextResponse.redirect(new URL("/", base));
  }
  if (!ad.contactWebsite) {
    return NextResponse.redirect(new URL(`/ad/${id}`, base));
  }

  await db
    .update(ads)
    .set({ websiteClickCount: sql`${ads.websiteClickCount} + 1` })
    .where(eq(ads.id, id))
    .catch(() => {});

  const destination = /^https?:\/\//i.test(ad.contactWebsite)
    ? ad.contactWebsite
    : `https://${ad.contactWebsite}`;

  return NextResponse.redirect(destination);
}
