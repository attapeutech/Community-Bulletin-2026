"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays } from "@/lib/leads";
import { FOLLOW_UP_CHIP, appointmentType, fmtTime, localDay, type Appointment } from "@/lib/appointments";
import AppointmentDialog, { type AppointmentDraft, type LeadOption } from "../AppointmentDialog";

export type FollowUp = { leadId: string; businessName: string; kind: string; day: string };

type Item =
  | { kind: "appt"; key: string; sort: string; appt: Appointment }
  | { kind: "follow"; key: string; sort: string; follow: FollowUp };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_IN_CELL = 3;

/** "2026-11" ± n months */
function shiftMonth(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();
const fmtMonth = (month: string) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const fmtDayLong = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });

export default function CalendarClient({ month, today, mine, appointments, followUps, leads }: {
  month: string;
  today: string;      // Pacific, "YYYY-MM-DD"
  mine: boolean;
  appointments: Appointment[];
  followUps: FollowUp[];
  leads: LeadOption[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [selected, setSelected] = useState<string>(today.startsWith(month) ? today : `${month}-01`);
  // Appointment days depend on the browser's time zone, so place them after the first render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setSelected(today.startsWith(month) ? today : `${month}-01`), [month, today]);

  const go = (changes: { month?: string; mine?: boolean }) => {
    const p = new URLSearchParams();
    const m = changes.month ?? month;
    if (m !== today.slice(0, 7)) p.set("month", m);
    if (changes.mine ?? mine) p.set("owner", "me");
    router.push(`/dashboard/sales/calendar${p.size ? `?${p}` : ""}`);
  };

  // Weeks shown: from the Sunday before the 1st to the Saturday after the last day
  const days = useMemo(() => {
    const first = `${month}-01`;
    const last = addDays(shiftMonth(month, 1) + "-01", -1);
    const start = addDays(first, -weekday(first));
    const end = addDays(last, 6 - weekday(last));
    const out: string[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, Item[]>();
    const push = (day: string, item: Item) => map.set(day, [...(map.get(day) ?? []), item]);
    if (mounted) for (const a of appointments) push(localDay(new Date(a.startsAt)), { kind: "appt", key: a.id, sort: a.startsAt, appt: a });
    // Follow-ups have no time: list them after the day's appointments
    for (const f of followUps) push(f.day, { kind: "follow", key: `f-${f.leadId}`, sort: "~" + f.businessName, follow: f });
    for (const list of map.values()) list.sort((x, y) => x.sort.localeCompare(y.sort));
    return map;
  }, [appointments, followUps, mounted]);

  const open = (item: Item) => {
    if (item.kind === "appt") setDraft({ kind: "edit", appointment: item.appt });
    else router.push(`/dashboard/sales/${item.follow.leadId}`);
  };

  const chip = (item: Item, compact: boolean) => (
    <button
      key={item.key}
      type="button"
      onClick={e => { e.stopPropagation(); open(item); }}
      title={item.kind === "appt" ? `${appointmentType(item.appt.type).label} · ${item.appt.businessName}` : `Follow up · ${item.follow.businessName}`}
      className={cn(
        "w-full text-left border rounded px-1.5 py-0.5 truncate",
        compact ? "text-[11px]" : "text-[13px] py-1.5 px-2.5",
        item.kind === "appt" ? appointmentType(item.appt.type).chip : FOLLOW_UP_CHIP,
      )}
    >
      {item.kind === "appt"
        ? <><span className="font-semibold">{fmtTime(item.appt.startsAt)}</span> {compact ? "" : `${appointmentType(item.appt.type).label} · `}{item.appt.businessName}</>
        : <>↻ {compact ? "" : "Follow up · "}{item.follow.businessName}</>}
    </button>
  );

  // Phones: every day of the month that has something, from today on in the current month
  const agendaDays = days.filter(d => d.startsWith(month) && (byDay.get(d)?.length ?? 0) > 0 && (!today.startsWith(month) || d >= today));
  const selectedItems = byDay.get(selected) ?? [];

  return (
    <div className="w-full">
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1">Sales calendar</h1>
          <p className="text-[#4A6B82] text-sm">Appointments and follow-up dates. Click a day to see it; click an item to open it.</p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ kind: "new", date: selected })}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#1A3A5C] text-white text-[13px] font-semibold"
        >
          <Plus size={15} /> New appointment
        </button>
      </div>

      {/* Same tabs as the Sales page */}
      <div className="flex gap-1 mb-5 border-b border-[#D8E4EE]">
        <Link href="/dashboard/sales?kind=store_partner" className="px-4 py-2 -mb-px border-b-2 border-transparent text-[14px] font-semibold text-[#4A6B82] hover:text-[#1A3A5C] no-underline">1 · Stores</Link>
        <Link href="/dashboard/sales" className="px-4 py-2 -mb-px border-b-2 border-transparent text-[14px] font-semibold text-[#4A6B82] hover:text-[#1A3A5C] no-underline">2 · Advertisers</Link>
        <span className="px-4 py-2 -mb-px border-b-2 border-[#E8563A] text-[14px] font-semibold text-[#1A3A5C]">Calendar</span>
      </div>

      {/* Month, navigation, filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button type="button" aria-label="Previous month" onClick={() => go({ month: shiftMonth(month, -1) })} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-[#D8E4EE] bg-white text-[#1A3A5C]"><ChevronLeft size={16} /></button>
        <button type="button" aria-label="Next month" onClick={() => go({ month: shiftMonth(month, 1) })} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-[#D8E4EE] bg-white text-[#1A3A5C]"><ChevronRight size={16} /></button>
        <h2 className="font-serif text-[20px] font-bold text-[#1A3A5C] mx-1">{fmtMonth(month)}</h2>
        {!today.startsWith(month) && (
          <button type="button" onClick={() => go({ month: today.slice(0, 7) })} className="h-9 px-3 rounded-md border border-[#D8E4EE] bg-white text-[13px] text-[#1A3A5C]">Today</button>
        )}
        <select aria-label="Owner" value={mine ? "me" : ""} onChange={e => go({ mine: e.target.value === "me" })} className="ml-auto h-9 rounded-md border border-[#D8E4EE] bg-white px-2.5 text-[13px] text-[#1A3A5C]">
          <option value="">Everyone&apos;s leads</option>
          <option value="me">My leads</option>
        </select>
      </div>

      {/* Desktop: month grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 rounded-xl border border-[#D8E4EE] overflow-hidden bg-white">
          {WEEKDAYS.map(w => (
            <div key={w} className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] bg-[#F4F7FB] border-b border-[#D8E4EE]">{w}</div>
          ))}
          {days.map((d, i) => {
            const items = byDay.get(d) ?? [];
            const inMonth = d.startsWith(month);
            return (
              <div
                key={d}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(d)}
                onDoubleClick={() => setDraft({ kind: "new", date: d })}
                onKeyDown={e => { if (e.key === "Enter") setSelected(d); }}
                className={cn(
                  "min-h-[112px] p-1.5 flex flex-col gap-1 cursor-pointer border-[#D8E4EE] text-left",
                  i % 7 !== 6 && "border-r",
                  i < days.length - 7 && "border-b",
                  !inMonth && "bg-[#FAFBFD] dark:bg-white/[0.03]",
                  selected === d && "ring-2 ring-inset ring-[#4A90C4]",
                )}
              >
                <div className={cn(
                  "text-[12px] font-semibold w-6 h-6 inline-flex items-center justify-center rounded-full",
                  d === today ? "bg-[#E8563A] text-white" : inMonth ? "text-[#1A3A5C]" : "text-[#9DB8CC] dark:text-[#5A7A94]",
                )}>
                  {Number(d.slice(8))}
                </div>
                {items.slice(0, MAX_IN_CELL).map(item => chip(item, true))}
                {items.length > MAX_IN_CELL && <div className="text-[11px] text-[#4A6B82] px-1">+{items.length - MAX_IN_CELL} more</div>}
              </div>
            );
          })}
        </div>

        {/* The selected day, in full */}
        <div className="mt-4 rounded-xl border border-[#D8E4EE] bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="font-semibold text-[15px] text-[#1A3A5C]">{fmtDayLong(selected)}</div>
            <button type="button" onClick={() => setDraft({ kind: "new", date: selected })} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4A90C4] hover:underline">
              <Plus size={14} /> Add appointment
            </button>
          </div>
          {selectedItems.length === 0
            ? <div className="text-[13px] text-[#4A6B82]">Nothing scheduled. Double-click a day in the calendar to add an appointment.</div>
            : <div className="flex flex-col gap-1.5">{selectedItems.map(item => chip(item, false))}</div>}
        </div>
      </div>

      {/* Phones: day-by-day list */}
      <div className="md:hidden flex flex-col gap-4">
        {agendaDays.length === 0 && (
          <div className="rounded-xl border border-[#D8E4EE] bg-white p-4 text-[13px] text-[#4A6B82]">
            Nothing scheduled{today.startsWith(month) ? " for the rest of the month" : " this month"}.
          </div>
        )}
        {agendaDays.map(d => (
          <div key={d}>
            <div className={cn("text-[12px] font-semibold uppercase tracking-wide mb-1.5", d === today ? "text-[#E8563A]" : "text-[#4A6B82]")}>
              {d === today ? "Today · " : ""}{fmtDayLong(d)}
            </div>
            <div className="flex flex-col gap-1.5">{(byDay.get(d) ?? []).map(item => chip(item, false))}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3 flex-wrap text-[11px] text-[#4A6B82]">
        {(["visit", "call", "demo", "meeting"] as const).map(t => (
          <span key={t} className={cn("border rounded px-1.5 py-0.5", appointmentType(t).chip)}>{appointmentType(t).label}</span>
        ))}
        <span className={cn("border rounded px-1.5 py-0.5", FOLLOW_UP_CHIP)}>↻ Follow-up date</span>
      </div>

      <AppointmentDialog draft={draft} onClose={() => setDraft(null)} leads={leads} />
    </div>
  );
}
