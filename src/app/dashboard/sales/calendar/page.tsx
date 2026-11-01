import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { appointments, leads } from "@/lib/db/schema";
import { and, asc, eq, gte, inArray, lt, lte } from "drizzle-orm";
import { addDays, leadToday, type LeadStage } from "@/lib/leads";
import CalendarClient, { type FollowUp } from "./CalendarClient";
import type { Appointment } from "@/lib/appointments";
import type { LeadOption } from "../AppointmentDialog";

export const dynamic = "force-dynamic";

const OPEN_STAGES: LeadStage[] = ["new", "contacted", "interested"];

export default async function SalesCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireAdmin();
  const me = (session.user as any).id as string;
  const sp = await searchParams;
  const today = leadToday();
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : today.slice(0, 7);
  const mine = sp.owner === "me";

  // The month grid shows up to 6 days of the months either side; one more day each way covers time zones
  const from = addDays(`${month}-01`, -8);
  const to = addDays(`${month}-01`, 31 + 15);

  const [apptRows, followRows, leadRows] = await Promise.all([
    db.select({
      id: appointments.id,
      leadId: appointments.leadId,
      businessName: leads.businessName,
      leadKind: leads.kind,
      type: appointments.type,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      place: appointments.place,
      notes: appointments.notes,
    })
      .from(appointments)
      .innerJoin(leads, eq(appointments.leadId, leads.id))
      .where(and(
        gte(appointments.startsAt, new Date(`${from}T00:00:00Z`)),
        lt(appointments.startsAt, new Date(`${to}T00:00:00Z`)),
        mine ? eq(leads.ownerId, me) : undefined,
      ))
      .orderBy(asc(appointments.startsAt)),
    // Follow-up dates of open leads
    db.select({ leadId: leads.id, businessName: leads.businessName, kind: leads.kind, day: leads.nextFollowUp })
      .from(leads)
      .where(and(
        inArray(leads.stage, OPEN_STAGES),
        gte(leads.nextFollowUp, from),
        lte(leads.nextFollowUp, to),
        mine ? eq(leads.ownerId, me) : undefined,
      ))
      .orderBy(asc(leads.businessName)),
    // Leads to schedule with: open ones, plus won (renewals, check-ins)
    db.select({ id: leads.id, businessName: leads.businessName, kind: leads.kind, address: leads.address, city: leads.city })
      .from(leads)
      .where(inArray(leads.stage, [...OPEN_STAGES, "won"]))
      .orderBy(asc(leads.businessName))
      .limit(1000),
  ]);

  const appts: Appointment[] = apptRows.map(a => ({ ...a, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString() }));
  const followUps: FollowUp[] = followRows.map(f => ({ leadId: f.leadId, businessName: f.businessName, kind: f.kind, day: f.day! }));
  const leadOptions: LeadOption[] = leadRows.map(l => ({
    id: l.id,
    label: `${l.businessName} · ${l.kind === "advertiser" ? "Advertiser" : "Store"}`,
    place: [l.address, l.city].filter(Boolean).join(", ") || null,
  }));

  return <CalendarClient month={month} today={today} mine={mine} appointments={appts} followUps={followUps} leads={leadOptions} />;
}
