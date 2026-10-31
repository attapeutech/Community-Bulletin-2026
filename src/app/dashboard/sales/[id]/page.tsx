import { notFound } from "next/navigation";
import { alias } from "drizzle-orm/pg-core";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { leads, leadNotes, users, payments, ads, locations, demos } from "@/lib/db/schema";
import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { leadToday } from "@/lib/leads";
import { storeOptions } from "../store-options";
import LeadDetailClient, { type LeadDetail } from "./LeadDetailClient";
import type { LeadDemo } from "./LeadDemos";

export const dynamic = "force-dynamic";

const owner = alias(users, "owner");
const customer = alias(users, "customer");

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [row] = await db
    .select({
      lead: leads,
      ownerName: owner.name,
      customerName: customer.name,
      customerEmail: customer.email,
      customerRole: customer.role,
      storeName: locations.storeName,
      storeNumber: locations.storeNumber,
    })
    .from(leads)
    .leftJoin(owner, eq(leads.ownerId, owner.id))
    .leftJoin(customer, eq(leads.userId, customer.id))
    .leftJoin(locations, eq(leads.locationId, locations.id))
    .where(eq(leads.id, id))
    .limit(1);
  if (!row) notFound();

  const [notes, [spend], storeRows, demoRows] = await Promise.all([
    db.select({ id: leadNotes.id, body: leadNotes.body, createdAt: leadNotes.createdAt, authorName: users.name })
      .from(leadNotes)
      .leftJoin(users, eq(leadNotes.authorId, users.id))
      .where(eq(leadNotes.leadId, id))
      .orderBy(desc(leadNotes.createdAt)),
    // What the linked customer has paid so far (refunded / unpaid don't count)
    row.lead.userId
      ? db.select({
          count: sql<number>`count(*)::int`,
          cents: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int`,
          ads: sql<number>`count(distinct ${payments.adId})::int`,
        })
          .from(payments)
          .innerJoin(ads, eq(payments.adId, ads.id))
          .where(and(eq(payments.userId, row.lead.userId), notInArray(payments.status, ["refunded", "refund_pending", "no_payment", "failed"])))
      : Promise.resolve([null]),
    db.select({ id: locations.id, storeName: locations.storeName, storeNumber: locations.storeNumber })
      .from(locations)
      .where(eq(locations.isActive, true))
      .orderBy(asc(locations.storeName)),
    // Advertiser: demos made for them, newest first
    row.lead.kind === "advertiser"
      ? db.select({ id: demos.id, token: demos.token, locationId: demos.locationId, expiresAt: demos.expiresAt, storeName: locations.storeName, storeNumber: locations.storeNumber, storeSlug: locations.slug })
          .from(demos)
          .innerJoin(locations, eq(demos.locationId, locations.id))
          .where(eq(demos.leadId, id))
          .orderBy(desc(demos.createdAt))
      : Promise.resolve([]),
  ]);
  const demoAds = demoRows.length
    ? await db.select({ id: ads.id, demoId: ads.demoId, title: ads.title, imageUrl: ads.imageUrl })
        .from(ads)
        .where(inArray(ads.demoId, demoRows.map(d => d.id)))
        .orderBy(asc(ads.createdAt))
    : [];
  const leadDemos: LeadDemo[] = demoRows.map(d => ({
    id: d.id,
    token: d.token,
    locationId: d.locationId,
    storeLabel: storeOptions([{ id: d.locationId, storeName: d.storeName, storeNumber: d.storeNumber }])[0].label,
    storeSlug: d.storeSlug,
    expiresAt: d.expiresAt.toISOString(),
    ads: demoAds.filter(a => a.demoId === d.id).map(a => ({ id: a.id, title: a.title, imageUrl: a.imageUrl })),
  }));

  const l = row.lead;
  const data: LeadDetail = {
    id: l.id,
    kind: l.kind,
    locationId: l.locationId,
    storeLabel: row.storeName ? storeOptions([{ id: "", storeName: row.storeName, storeNumber: row.storeNumber }])[0].label : null,
    businessName: l.businessName,
    contactName: l.contactName,
    phone: l.phone,
    email: l.email,
    city: l.city,
    address: l.address,
    source: l.source,
    stage: l.stage,
    nextFollowUp: l.nextFollowUp,
    lostReason: l.lostReason,
    wonAt: l.wonAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    ownerName: row.ownerName,
    customer: l.userId ? { name: row.customerName ?? "", email: row.customerEmail ?? "", role: row.customerRole ?? "user", ...(spend ?? { count: 0, cents: 0, ads: 0 }) } : null,
    notes: notes.map(n => ({ id: n.id, body: n.body, authorName: n.authorName, createdAt: n.createdAt.toISOString() })),
  };

  return <LeadDetailClient lead={data} today={leadToday()} stores={storeOptions(storeRows)} demos={leadDemos} />;
}
