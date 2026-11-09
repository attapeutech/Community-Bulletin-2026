import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, demos, leadNotes, leads, locations, proposals } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { newProposalToken, proposalPath } from "@/lib/proposals";
import { sendProposalEmail } from "@/lib/email/templates";
import { SALES_EMAIL } from "@/lib/leads";
import { formatPrice } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

const schema = z.object({
  demoId: z.string().uuid(),
  demoAdId: z.string().uuid("Choose the demo ad to offer"),
  email: z.string().trim().toLowerCase().email("Enter the advertiser's email"),
  // false: only make the link (the salesperson texts or shows it); the email is still who the ad and receipt go to
  send: z.boolean().default(true),
  subject: z.string().trim().max(200).default(""),
  message: z.string().trim().max(5000).default(""),
}).refine(d => !d.send || d.subject, { message: "Add a subject", path: ["subject"] })
  .refine(d => !d.send || d.message, { message: "Add a message", path: ["message"] });

// POST /api/admin/proposals — email an advertiser lead a demo ad they can pay for, or just make the link to text them
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    const d = parsed.data;

    // The demo must still be open, and the ad must be one of its demo ads
    const [demo] = await db
      .select({ id: demos.id, leadId: demos.leadId, businessName: leads.businessName, storeName: locations.storeName, price: locations.pricePerRunCents })
      .from(demos)
      .innerJoin(leads, eq(demos.leadId, leads.id))
      .innerJoin(locations, eq(demos.locationId, locations.id))
      .where(and(eq(demos.id, d.demoId), gt(demos.expiresAt, new Date())))
      .limit(1);
    if (!demo) return NextResponse.json({ success: false, error: "This demo has expired or was deleted" }, { status: 404 });
    const [ad] = await db.select({ id: ads.id }).from(ads).where(and(eq(ads.id, d.demoAdId), eq(ads.demoId, demo.id))).limit(1);
    if (!ad) return NextResponse.json({ success: false, error: "Choose one of this demo's ads" }, { status: 422 });

    const token = newProposalToken();
    const [proposal] = await db.insert(proposals).values({
      leadId: demo.leadId,
      demoId: demo.id,
      demoAdId: ad.id,
      token,
      email: d.email,
      subject: d.subject,
      message: d.message,
      createdBy: adminId,
    }).returning({ id: proposals.id });

    const url = `${SITE_URL}${proposalPath(token)}`;
    const sent = !d.send ? { success: true } : await sendProposalEmail({
      to: d.email,
      replyTo: SALES_EMAIL,
      subject: d.subject,
      message: d.message,
      businessName: demo.businessName,
      storeName: demo.storeName,
      price: formatPrice(demo.price),
      url,
    });
    if (!sent.success) {
      await db.delete(proposals).where(eq(proposals.id, proposal.id));
      return NextResponse.json({ success: false, error: "The email couldn't be sent. Try again in a moment." }, { status: 502 });
    }

    const now = new Date();
    await db.update(proposals).set({ sentAt: now }).where(eq(proposals.id, proposal.id));
    await db.insert(leadNotes).values({ leadId: demo.leadId, authorId: adminId, body: d.send ? `Proposal sent to ${d.email}: "${d.subject}"` : `Proposal link made for ${d.email} (to text or show them)` });
    await db.update(leads).set({ updatedAt: now }).where(eq(leads.id, demo.leadId));

    return NextResponse.json({ success: true, data: { id: proposal.id, url } });
  } catch (error) {
    console.error("[POST /api/admin/proposals]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
