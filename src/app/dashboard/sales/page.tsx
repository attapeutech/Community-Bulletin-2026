import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, leads, locations, users } from "@/lib/db/schema";
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, isNull, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { LEADS_PAGE_SIZE, LEAD_STAGE_VALUES, addDays, leadToday, type LeadStage } from "@/lib/leads";
import SalesClient, { type LeadRow, type SalesFilters, type StoreGoal } from "./SalesClient";

export const dynamic = "force-dynamic";

const OPEN_STAGES: LeadStage[] = ["new", "contacted", "interested"];
const UUID = /^[0-9a-f-]{36}$/i;

function readFilters(sp: Record<string, string | string[] | undefined>): SalesFilters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) ?? "";
  const stage = one("stage");
  const due = one("due");
  const sort = one("sort");
  const store = one("store");
  return {
    kind: one("kind") === "store_partner" ? "store_partner" : "advertiser",
    q: one("q").trim().slice(0, 100),
    stage: stage === "all" || (LEAD_STAGE_VALUES as string[]).includes(stage) ? stage : "open",
    due: ["due", "overdue", "today", "week", "none"].includes(due) ? due : "",
    store: UUID.test(store) ? store : "",
    city: one("city").trim().slice(0, 100),
    owner: one("owner") === "me" ? "me" : "",
    sort: ["updated", "name", "created"].includes(sort) ? sort : "follow_up",
    page: Math.max(1, Number.parseInt(one("page"), 10) || 1),
  };
}

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdmin();
  const me = (session.user as any).id as string;
  const f = readFilters(await searchParams);
  const today = leadToday();
  // Timestamps go to SQL as UTC ISO strings, matching how drizzle writes timestamp columns
  const now = new Date().toISOString();
  const open = inArray(leads.stage, OPEN_STAGES);
  const ofKind = eq(leads.kind, f.kind);

  const where: SQL[] = [ofKind];
  if (f.stage === "open") where.push(open);
  else if (f.stage !== "all") where.push(eq(leads.stage, f.stage as LeadStage));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push(or(ilike(leads.businessName, like), ilike(leads.contactName, like), ilike(leads.phone, like), ilike(leads.email, like))!);
  }
  if (f.store) where.push(eq(leads.locationId, f.store));
  if (f.city) where.push(eq(leads.city, f.city));
  if (f.owner === "me") where.push(eq(leads.ownerId, me));
  if (f.due === "due") where.push(open, lte(leads.nextFollowUp, today));
  if (f.due === "overdue") where.push(open, lt(leads.nextFollowUp, today));
  if (f.due === "today") where.push(eq(leads.nextFollowUp, today));
  if (f.due === "week") where.push(open, lte(leads.nextFollowUp, addDays(today, 7)));
  if (f.due === "none") where.push(open, isNull(leads.nextFollowUp));
  const filter = and(...where);

  const orderBy =
    f.sort === "updated" ? [desc(leads.updatedAt)]
    : f.sort === "name" ? [asc(leads.businessName)]
    : f.sort === "created" ? [desc(leads.createdAt)]
    // Most urgent first; leads with no follow-up date go last
    : [sql`${leads.nextFollowUp} asc nulls last`, desc(leads.updatedAt)];

  // Advertiser leads per store, for the goal cards
  const advertiserLeads = (stageSql: SQL) => sql<number>`(
    select count(*)::int from ${leads}
    where ${leads.kind} = 'advertiser' and ${leads.locationId} = ${locations.id} and ${stageSql}
  )`;

  const [[{ total }], summary, cityRows, storeRows] = await Promise.all([
    db.select({ total: count() }).from(leads).where(filter),
    db.select({
      dueToday: sql<number>`count(*) filter (where ${leads.nextFollowUp} = ${today} and ${open})::int`,
      overdue: sql<number>`count(*) filter (where ${leads.nextFollowUp} < ${today} and ${open})::int`,
      interested: sql<number>`count(*) filter (where ${leads.stage} = 'interested')::int`,
      won30: sql<number>`count(*) filter (where ${leads.wonAt} >= ${new Date(Date.now() - 30 * 86400_000).toISOString()})::int`,
      all: sql<number>`count(*)::int`,
    }).from(leads).where(ofKind),
    db.selectDistinct({ city: leads.city }).from(leads).where(and(ofKind, isNotNull(leads.city))).orderBy(asc(leads.city)),
    // Active stores and their progress toward the ads-per-store goal
    db.select({
      id: locations.id,
      storeName: locations.storeName,
      storeNumber: locations.storeNumber,
      live: sql<number>`(
        select count(*)::int from ${ads}
        where ${ads.locationId} = ${locations.id} and ${ads.status} = 'approved'
          and ${ads.paymentStatus} = 'paid' and ${ads.isTest} = false
          and ${ads.startedAt} <= ${now} and ${ads.endedAt} > ${now}
      )`,
      pendingReview: sql<number>`(
        select count(*)::int from ${ads}
        where ${ads.locationId} = ${locations.id} and ${ads.status} = 'pending' and ${ads.paymentStatus} = 'paid'
      )`,
      openLeads: advertiserLeads(sql`${leads.stage} in ('new', 'contacted', 'interested')`),
      interested: advertiserLeads(sql`${leads.stage} = 'interested'`),
    })
      .from(locations)
      .where(eq(locations.isActive, true))
      .orderBy(asc(locations.storeName)),
  ]);

  const pages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));
  const page = Math.min(f.page, pages);

  const rows = await db
    .select({
      id: leads.id,
      kind: leads.kind,
      businessName: leads.businessName,
      contactName: leads.contactName,
      phone: leads.phone,
      email: leads.email,
      city: leads.city,
      stage: leads.stage,
      nextFollowUp: leads.nextFollowUp,
      updatedAt: leads.updatedAt,
      storeName: locations.storeName,
      ownerName: users.name,
      linked: sql<boolean>`${leads.userId} is not null`,
    })
    .from(leads)
    .leftJoin(users, eq(leads.ownerId, users.id))
    .leftJoin(locations, eq(leads.locationId, locations.id))
    .where(filter)
    .orderBy(...orderBy)
    .limit(LEADS_PAGE_SIZE)
    .offset((page - 1) * LEADS_PAGE_SIZE);

  const data: LeadRow[] = rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
  const stores: StoreGoal[] = storeRows.map(s => ({
    ...s,
    label: s.storeNumber ? `${s.storeName} #${s.storeNumber.replace(/^#/, "")}` : s.storeName,
  }));

  return (
    <SalesClient
      key={`${f.kind}|${f.q}`}  // reset the search box when the tab or search changes, including via Back / Forward
      leads={data}
      filters={{ ...f, page }}
      total={total}
      pages={pages}
      today={today}
      summary={summary[0]}
      cities={cityRows.map(c => c.city!).filter(Boolean)}
      stores={stores}
    />
  );
}
