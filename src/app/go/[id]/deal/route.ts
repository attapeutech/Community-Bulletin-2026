import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { recordWebsiteVisit } from "@/lib/click-tracking";
import { websiteUrl } from "@/lib/ad-templates";

export const dynamic = "force-dynamic";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /go/[id]/deal — "See the deal" on the QR page: counts a website visit, then opens the site
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  if (!UUID_RE.test(id)) return NextResponse.redirect(new URL("/", base));
  const [ad] = await db.select({ contactWebsite: ads.contactWebsite }).from(ads).where(eq(ads.id, id)).limit(1);
  if (!ad?.contactWebsite?.trim()) return NextResponse.redirect(new URL(ad ? `/ad/${id}` : "/", base));
  await recordWebsiteVisit(req, id);
  return NextResponse.redirect(websiteUrl(ad.contactWebsite.trim()));
}
