import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { demos, leads, locations, proposals, cities, states } from "@/lib/db/schema";

/** A proposal by its link token, with what the advertiser's page needs (null when the token is unknown) */
export async function loadProposal(token: string) {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  const [row] = await db
    .select({
      id: proposals.id,
      leadId: proposals.leadId,
      demoId: proposals.demoId,
      demoAdId: proposals.demoAdId,
      email: proposals.email,
      createdBy: proposals.createdBy,
      viewedAt: proposals.viewedAt,
      acceptedAt: proposals.acceptedAt,
      paidAt: proposals.paidAt,
      adId: proposals.adId,
      userId: proposals.userId,
      expiresAt: demos.expiresAt,
      demoToken: demos.token,
      locationId: demos.locationId,
      businessName: leads.businessName,
      contactName: leads.contactName,
      phone: leads.phone,
      storeName: locations.storeName,
      storeSlug: locations.slug,
      storeActive: locations.isActive,
      price: locations.pricePerRunCents,
      shoppers: locations.dailyCustomers,
      storeAddress: locations.addressLine1,
      city: cities.name,
      state: states.code,
    })
    .from(proposals)
    .innerJoin(demos, eq(proposals.demoId, demos.id))
    .innerJoin(leads, eq(proposals.leadId, leads.id))
    .innerJoin(locations, eq(demos.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .where(eq(proposals.token, token))
    .limit(1);
  return row ?? null;
}

export type LoadedProposal = NonNullable<Awaited<ReturnType<typeof loadProposal>>>;

/** Why a proposal can't be accepted now, or null when it can */
export function proposalBlocked(p: LoadedProposal, now = new Date()) {
  if (p.paidAt) return "This proposal has already been accepted and paid.";
  if (p.expiresAt < now) return "This proposal has expired. Reply to the email and we'll send a new one.";
  if (!p.storeActive) return "This screen isn't taking new ads right now. Reply to the email and we'll help.";
  if (!p.demoAdId) return "This ad is no longer available. Reply to the email and we'll send a new one.";
  return null;
}
