import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { db } from "@/lib/db/client";
import { ads, leadNotes, proposals } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { loadProposal, proposalBlocked } from "@/lib/proposal-access";
import { AD_DURATION_DAYS } from "@/types";

// POST /api/proposals/[token]/accept — signed-in advertiser accepts: the demo ad is copied into a real,
// unpaid ad in their account, and the page sends them to the usual payment page for it
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Sign in to accept" }, { status: 401 });
    const user = session.user as { id: string; name: string; email: string };

    const { token } = await params;
    const p = await loadProposal(token);
    if (!p) return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    const blocked = proposalBlocked(p);
    if (blocked) return NextResponse.json({ success: false, error: blocked }, { status: 409 });

    // Accepting again (e.g. back from Stripe without paying) reuses their unpaid ad
    if (p.adId) {
      const [existing] = await db.select({ id: ads.id }).from(ads)
        .where(and(eq(ads.id, p.adId), eq(ads.userId, user.id), eq(ads.paymentStatus, "unpaid"))).limit(1);
      if (existing) return NextResponse.json({ success: true, data: { adId: existing.id } });
    }

    const [demoAd] = await db.select().from(ads).where(and(eq(ads.id, p.demoAdId!), eq(ads.demoId, p.demoId))).limit(1);
    if (!demoAd) return NextResponse.json({ success: false, error: "This ad is no longer available. Reply to the email and we'll send a new one." }, { status: 409 });

    const now = new Date();
    const [ad] = await db.insert(ads).values({
      userId: user.id,
      locationId: p.locationId,
      title: demoAd.title,
      description: demoAd.description,
      imageUrl: demoAd.imageUrl,
      imageKey: demoAd.imageKey,
      template: demoAd.template,
      templateData: demoAd.templateData,
      contactPhone: demoAd.contactPhone,
      contactAddress: demoAd.contactAddress,
      contactWebsite: demoAd.contactWebsite,
      showPhone: demoAd.showPhone,
      showAddress: demoAd.showAddress,
      showWebsite: demoAd.showWebsite,
      // Unpaid until checkout; the payment puts it live (see proposal-payments.ts)
      status: "pending",
      paymentStatus: "unpaid",
      startedAt: now,
      endedAt: addDays(now, AD_DURATION_DAYS),
      displayOrder: 0,
    }).returning({ id: ads.id });

    await db.update(proposals).set({ adId: ad.id, userId: user.id, acceptedAt: p.acceptedAt ?? now }).where(eq(proposals.id, p.id));
    if (!p.acceptedAt) {
      await db.insert(leadNotes).values({ leadId: p.leadId, authorId: null, body: `Proposal accepted by ${user.name} (${user.email}); going to payment` });
    }

    return NextResponse.json({ success: true, data: { adId: ad.id } });
  } catch (error) {
    console.error("[POST /api/proposals/[token]/accept]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
