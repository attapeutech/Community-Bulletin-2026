// Server only. "Pay now" / "Copy link" on the Sales list: one click gives an advertiser lead's
// proposal link, without opening the lead, Send proposal and Text it / show it.
// Reuses the lead's open (unpaid, not expired) proposal; otherwise makes one like "Text it / show it"
// does: the lead's newest open demo, that demo's newest ad, and the email on the lead.
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, demos, leadNotes, leads, proposals } from "@/lib/db/schema";
import { newProposalToken, proposalPath } from "@/lib/proposals";
import { SITE_URL } from "@/lib/site";

/** What the list row can do: a ready link, a link it can make, or why not */
export type QuickPay =
  | { state: "ready"; url: string }
  | { state: "can_make" }
  | { state: "need_email" }   // has a demo ad; the button asks for the email (saved to the lead)
  | { state: "missing"; reason: string };

const isEmail = (v: string | null) => !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

async function openProposals(leadIds: string[]) {
  if (!leadIds.length) return [];
  return db
    .select({ leadId: proposals.leadId, token: proposals.token })
    .from(proposals)
    .innerJoin(demos, eq(proposals.demoId, demos.id))
    .where(and(inArray(proposals.leadId, leadIds), isNull(proposals.paidAt), gt(demos.expiresAt, new Date())))
    .orderBy(desc(proposals.createdAt));
}

async function openDemoAds(leadIds: string[]) {
  if (!leadIds.length) return [];
  return db
    .select({ leadId: demos.leadId, demoId: demos.id, adId: ads.id })
    .from(demos)
    .innerJoin(ads, eq(ads.demoId, demos.id))
    .where(and(inArray(demos.leadId, leadIds), gt(demos.expiresAt, new Date())))
    .orderBy(desc(demos.createdAt), desc(ads.createdAt));
}

/** Quick-pay state for each lead on the list page (advertiser leads only) */
export async function quickPayFor(rows: { id: string; email: string | null }[]): Promise<Record<string, QuickPay>> {
  const ids = rows.map((r) => r.id);
  const [props, demoAds] = await Promise.all([openProposals(ids), openDemoAds(ids)]);
  const out: Record<string, QuickPay> = {};
  for (const r of rows) {
    const p = props.find((x) => x.leadId === r.id); // newest first
    if (p) out[r.id] = { state: "ready", url: `${SITE_URL}${proposalPath(p.token)}` };
    else if (!demoAds.some((d) => d.leadId === r.id)) out[r.id] = { state: "missing", reason: "Make a demo ad first" };
    else if (!isEmail(r.email)) out[r.id] = { state: "need_email" };
    else out[r.id] = { state: "can_make" };
  }
  return out;
}

/** The lead's open proposal link, or a new one; null with a reason when it can't be made */
export async function getOrMakeProposalLink(leadId: string, adminId: string, emailGiven?: string): Promise<{ url: string; made: boolean } | { error: string; needEmail?: boolean }> {
  const [lead] = await db.select({ id: leads.id, kind: leads.kind, email: leads.email }).from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead || lead.kind !== "advertiser") return { error: "Lead not found" };

  const [open] = await openProposals([leadId]);
  if (open) return { url: `${SITE_URL}${proposalPath(open.token)}`, made: false };

  const [demoAd] = await openDemoAds([leadId]);
  if (!demoAd) return { error: "Make a demo ad for this lead first" };
  // No email on the lead: use the one typed on the Sales list, and save it to the lead
  let email = isEmail(lead.email) ? lead.email!.trim().toLowerCase() : null;
  if (!email) {
    if (!isEmail(emailGiven ?? null)) return { error: "Enter their email (it's where the receipt goes)", needEmail: true };
    email = emailGiven!.trim().toLowerCase();
    await db.update(leads).set({ email }).where(eq(leads.id, leadId));
  }

  const token = newProposalToken();
  const now = new Date();
  await db.insert(proposals).values({
    leadId, demoId: demoAd.demoId, demoAdId: demoAd.adId, token, email,
    subject: "", message: "", createdBy: adminId, sentAt: now,
  });
  await db.insert(leadNotes).values({ leadId, authorId: adminId, body: `Proposal link made for ${email} (Pay now / Copy link on the Sales list)` });
  await db.update(leads).set({ updatedAt: now }).where(eq(leads.id, leadId));
  return { url: `${SITE_URL}${proposalPath(token)}`, made: true };
}
