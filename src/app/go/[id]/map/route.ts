import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { recordAdEvent } from "@/lib/click-tracking";
import { mapsUrl } from "@/lib/ad-templates";

export const dynamic = "force-dynamic";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /go/[id]/map[?app=google|apple] — "Get directions" on the QR page: counts a directions tap,
// then opens maps to the store's address (Apple Maps on Apple devices, Google Maps elsewhere)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  if (!UUID_RE.test(id)) return NextResponse.redirect(new URL("/", base));
  const [ad] = await db.select({ contactAddress: ads.contactAddress }).from(ads).where(eq(ads.id, id)).limit(1);
  const address = ad?.contactAddress?.trim();
  if (!address) return NextResponse.redirect(new URL(ad ? `/go/${id}/options` : "/", base));
  await recordAdEvent(req, id, "directions");
  const asked = req.nextUrl.searchParams.get("app");
  const apple = asked ? asked === "apple" : /iPhone|iPad|Macintosh/i.test(req.headers.get("user-agent") ?? "");
  return NextResponse.redirect(mapsUrl(address, apple ? "apple" : "google"));
}
