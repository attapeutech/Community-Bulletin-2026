import { notFound } from "next/navigation";
import { alias } from "drizzle-orm/pg-core";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { leads, leadNotes, users, payments, ads, locations } from "@/lib/db/schema";
import { and, asc, desc, eq, notInArray, sql } from "drizzle-orm";
import { leadToday } from "@/lib/leads";
import { storeOptions } from "../store-options";
import LeadDetailClient, { type LeadDetail } from "./LeadDetailClient";

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

  const [notes, [spend], storeRows] = await Promise.all([
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
  ]);

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

  return <LeadDetailClient lead={data} today={leadToday()} stores={storeOptions(storeRows)} />;
}
