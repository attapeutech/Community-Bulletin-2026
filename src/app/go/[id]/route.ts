import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { recordAdEvent, recordWebsiteVisit } from "@/lib/click-tracking";
import { qrOffer, websiteUrl } from "@/lib/ad-templates";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /go/[id] — public short link in display-screen QR codes. Counts the scan (bots and repeats
// within a minute excluded). Ads that also offer directions or a phone number open a small page
// (See the deal · Get directions · Call); an ad with only a website goes straight there (counted as a
// website visit, as before); an ad with neither goes to its public ad page.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  if (!UUID_RE.test(id)) return NextResponse.redirect(new URL("/", base));

  const [ad] = await db
    .select({
      contactWebsite: ads.contactWebsite, contactAddress: ads.contactAddress, contactPhone: ads.contactPhone,
      showWebsite: ads.showWebsite, showAddress: ads.showAddress, showPhone: ads.showPhone,
    })
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1);
  if (!ad) return NextResponse.redirect(new URL("/", base));

  await recordAdEvent(req, id, "scan");
  const offer = qrOffer(ad);

  if (offer.directions || offer.call) return NextResponse.redirect(new URL(`/go/${id}/options`, base));
  // Only a website (older ads may have one without the show switch on: still send them there)
  if (ad.contactWebsite?.trim()) {
    await recordWebsiteVisit(req, id);
    return NextResponse.redirect(websiteUrl(ad.contactWebsite.trim()));
  }
  return NextResponse.redirect(new URL(`/ad/${id}`, base));
}
