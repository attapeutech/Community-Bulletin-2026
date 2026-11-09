import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { db } from "@/lib/db/client";
import { ads, leadNotes, leads, proposals, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { loadProposal, proposalBlocked } from "@/lib/proposal-access";
import { proposalPath } from "@/lib/proposals";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { AD_DURATION_DAYS } from "@/types";

const schema = z.object({
  local: z.literal(true, { message: "Please tick both boxes to continue." }),
  terms: z.literal(true, { message: "Please tick both boxes to continue." }),
});

/**
 * POST /api/proposals/[token]/pay — public, no sign-in: the advertiser pays straight from their proposal link.
 * The ad goes to the account with the proposal's email (made now, without a password, when there isn't one;
 * an advertiser signed in with their own account gets it there). Nobody is signed in by this: the link only
 * lets you pay. The demo ad is copied into a real unpaid ad and we hand back a Stripe Checkout link; the payment
 * puts it live (proposal-payments.ts).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Please tick both boxes to continue." }, { status: 422 });

    const p = await loadProposal(token);
    if (!p) return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    const blocked = proposalBlocked(p);
    if (blocked) return NextResponse.json({ success: false, error: blocked }, { status: 409 });

    // Whose ad: a signed-in advertiser's own account; otherwise the proposal's email (the sales team
    // opening the link on their own device, e.g. to take payment at the counter, counts as "otherwise")
    const session = await getSession();
    const sessionUser = session?.user as { id: string; email: string; role?: string } | undefined;
    let user: { id: string; email: string } | null = null;
    if (sessionUser && sessionUser.role !== "admin") {
      user = { id: sessionUser.id, email: sessionUser.email };
    } else {
      const [lead] = await db.select({ contactName: leads.contactName, businessName: leads.businessName, phone: leads.phone })
        .from(leads).where(eq(leads.id, p.leadId)).limit(1);
      // The email the sales team sent it to counts as confirmed; they can set a password later
      await db.insert(users).values({
        name: (lead?.contactName || lead?.businessName || p.businessName).trim(),
        email: p.email,
        role: "user",
        emailVerified: true,
        defaultPhone: lead?.phone ?? null,
      }).onConflictDoNothing({ target: users.email });
      const [row] = await db.select({ id: users.id, email: users.email, banned: users.banned }).from(users).where(eq(users.email, p.email)).limit(1);
      if (!row || row.banned) return NextResponse.json({ success: false, error: "We couldn't set this up. Reply to the email and we'll help." }, { status: 409 });
      user = { id: row.id, email: row.email };
    }

    // Paying again (e.g. back from Stripe without paying) reuses their unpaid ad
    let adId: string | null = null;
    if (p.adId) {
      const [existing] = await db.select({ id: ads.id }).from(ads)
        .where(and(eq(ads.id, p.adId), eq(ads.userId, user.id), eq(ads.paymentStatus, "unpaid"))).limit(1);
      adId = existing?.id ?? null;
    }

    const now = new Date();
    if (!adId) {
      const [demoAd] = await db.select().from(ads).where(and(eq(ads.id, p.demoAdId!), eq(ads.demoId, p.demoId))).limit(1);
      if (!demoAd) return NextResponse.json({ success: false, error: "This ad is no longer available. Reply to the email and we'll send a new one." }, { status: 409 });
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
        // Unpaid until checkout; the payment puts it live
        status: "pending",
        paymentStatus: "unpaid",
        startedAt: now,
        endedAt: addDays(now, AD_DURATION_DAYS),
        displayOrder: 0,
      }).returning({ id: ads.id });
      adId = ad.id;
    }

    await db.update(proposals).set({ adId, userId: user.id, acceptedAt: p.acceptedAt ?? now }).where(eq(proposals.id, p.id));
    if (!p.acceptedAt) {
      await db.insert(leadNotes).values({ leadId: p.leadId, authorId: null, body: `Proposal accepted (${user.email}); going to payment` });
    }

    const back = `${SITE_URL}${proposalPath(token)}`;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: p.price,
          product_data: { name: `Community Bulletin Ad — ${p.businessName}`, description: `4-week display at ${p.storeName}` },
        },
        quantity: 1,
      }],
      metadata: { adId, userId: user.id, locationSlug: p.storeSlug, proposalId: p.id },
      success_url: `${back}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
    });

    return NextResponse.json({ success: true, data: { url: checkout.url } });
  } catch (error) {
    console.error("[POST /api/proposals/[token]/pay]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
