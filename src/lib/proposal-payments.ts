import { addDays } from "date-fns";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, cities, leadNotes, leads, locations, postalCodes, proposals, states, users } from "@/lib/db/schema";
import { AD_DURATION_DAYS } from "@/types";
import { setEarningsAvailableAt } from "@/lib/earnings";
import { notifyAdApproved, notifyUser } from "@/lib/notifications";
import { pushDisplayRefresh } from "@/lib/socket/notify";
import { sendAdApprovedEmail } from "@/lib/email/templates";
import { formatLocationLabel } from "@/lib/location-label";
import { stageLabel } from "@/lib/leads";

/** The open proposal an ad was created from, if any (checked before a payment is announced) */
export async function proposalForAd(adId: string) {
  const [p] = await db.select({ id: proposals.id }).from(proposals).where(and(eq(proposals.adId, adId), isNull(proposals.paidAt))).limit(1);
  return p ?? null;
}

/**
 * A proposal ad was paid (Stripe webhook or the success-page confirm, whichever records the payment):
 * put it live without review (the sales team built it), mark the proposal paid, make the lead Won and
 * link the advertiser's account, add timeline notes, and tell the salesperson.
 */
export async function completeProposalPayment(adId: string, amountCents: number) {
  const now = new Date();
  // Claim it once: only the call that sets paid_at goes on
  const [p] = await db.update(proposals).set({ paidAt: now })
    .where(and(eq(proposals.adId, adId), isNull(proposals.paidAt)))
    .returning({ id: proposals.id, leadId: proposals.leadId, createdBy: proposals.createdBy, userId: proposals.userId });
  if (!p) return false;

  const [row] = await db
    .select({
      ad: { id: ads.id, title: ads.title, status: ads.status, userId: ads.userId },
      user: { name: users.name, email: users.email },
      location: { slug: locations.slug, storeName: locations.storeName, storeNumber: locations.storeNumber, addressLine1: locations.addressLine1, cityName: cities.name, stateCode: states.code, postalCode: postalCodes.code },
    })
    .from(ads)
    .innerJoin(users, eq(ads.userId, users.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(eq(ads.id, adId))
    .limit(1);
  if (!row) return true;

  // Live now, like an approval (reviewed by whoever sent the proposal)
  const endedAt = addDays(now, AD_DURATION_DAYS);
  if (row.ad.status === "pending") {
    await db.update(ads).set({ status: "approved", reviewedBy: p.createdBy, reviewedAt: now, startedAt: now, endedAt, updatedAt: now }).where(eq(ads.id, adId));
    await setEarningsAvailableAt(adId, endedAt);
    await notifyAdApproved(adId, row.ad.userId, row.ad.title, endedAt);
    pushDisplayRefresh(row.location.slug).catch(console.error);
    sendAdApprovedEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      locationName: formatLocationLabel(row.location),
      locationSlug: row.location.slug,
      startedAt: now.toLocaleDateString("en-US", { dateStyle: "long" }),
      endedAt: endedAt.toLocaleDateString("en-US", { dateStyle: "long" }),
      adId,
    }).catch(console.error);
  }

  // The lead: Won, linked to the advertiser's account (kept for sales credit), with notes
  const [lead] = await db.select({ stage: leads.stage, userId: leads.userId, businessName: leads.businessName }).from(leads).where(eq(leads.id, p.leadId)).limit(1);
  if (lead) {
    await db.update(leads).set({
      stage: "won",
      wonAt: lead.stage === "won" ? undefined : now,
      userId: lead.userId ?? row.ad.userId,
      nextFollowUp: null,
      updatedAt: now,
    }).where(eq(leads.id, p.leadId));
    const notes = [`Proposal paid: $${(amountCents / 100).toFixed(2)} by ${row.user.name} (${row.user.email}). The ad is live at ${row.location.storeName}.`];
    if (lead.stage !== "won") notes.push(`Stage: ${stageLabel(lead.stage)} → Won`);
    await db.insert(leadNotes).values(notes.map(body => ({ leadId: p.leadId, authorId: null, body })));

    if (p.createdBy) {
      await notifyUser(p.createdBy, {
        type: "proposal_update",
        subject: `${lead.businessName} accepted and paid`,
        body: `$${(amountCents / 100).toFixed(2)} · their ad is live at ${row.location.storeName}`,
        link: `/dashboard/sales/${p.leadId}`,
      });
    }
  }
  return true;
}
