import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { loadPayLinkAd, newPayLinkToken, payLinkBlocked, payLinkPath, PAY_LINK_DAYS } from "@/lib/pay-links";
import { SITE_URL } from "@/lib/site";

// POST /api/admin/ads/[id]/pay-link — a link the advertiser can pay for their unpaid ad with, no sign-in
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });

    const ad = await loadPayLinkAd(id);
    if (!ad) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    const blocked = payLinkBlocked(ad);
    if (blocked) return NextResponse.json({ success: false, error: "Only unpaid, pending ads at an active store can get a pay link" }, { status: 409 });

    const url = `${SITE_URL}${payLinkPath(newPayLinkToken(ad.id))}`;
    return NextResponse.json({ success: true, data: { url, days: PAY_LINK_DAYS } });
  } catch (error) {
    console.error("[POST /api/admin/ads/[id]/pay-link]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
