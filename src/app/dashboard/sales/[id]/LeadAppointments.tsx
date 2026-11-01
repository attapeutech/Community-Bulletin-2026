"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { appointmentType, fmtTime, googleCalendarUrl, localDay, type Appointment } from "@/lib/appointments";
import AppointmentDialog, { type AppointmentDraft, type LeadOption } from "../AppointmentDialog";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/** Lead page: upcoming appointments with this lead, and a Schedule button */
export default function LeadAppointments({ lead, today, appointments }: { lead: LeadOption; today: string; appointments: Appointment[] }) {
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  // Times are shown in the browser's time zone, so only after the first render (the server's may differ)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card className="rounded-xl border-[#D8E4EE]">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82]">Upcoming</div>
          <Link href="/dashboard/sales/calendar" className="text-[12px] text-[#4A90C4] no-underline hover:underline">Calendar →</Link>
        </div>
        {appointments.length === 0 ? (
          <div className="text-[13px] text-[#4A6B82]">No appointments scheduled.</div>
        ) : !mounted ? (
          <div className="h-10 rounded-md bg-[#F4F7FB]" />
        ) : (
          <ul className="flex flex-col gap-2 m-0 p-0 list-none">
            {appointments.map(a => (
              <li key={a.id} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ kind: "edit", appointment: a })}
                  className={cn("flex-1 min-w-0 text-left border rounded-md px-2.5 py-1.5 text-[13px]", appointmentType(a.type).chip)}
                >
                  <div className="font-semibold">{appointmentType(a.type).label} · {localDay(new Date(a.startsAt)) === today ? "Today" : fmtDate(a.startsAt)}, {fmtTime(a.startsAt)}</div>
                  {a.place && <div className="text-[12px] truncate opacity-80">{a.place}</div>}
                </button>
                <a href={googleCalendarUrl(a)} target="_blank" rel="noopener noreferrer" aria-label="Add to Google Calendar" title="Add to Google Calendar" className="shrink-0 mt-1.5 text-[#4A6B82] hover:text-[#1A3A5C]">
                  <CalendarPlus size={16} />
                </a>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setDraft({ kind: "new", date: today })}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-[#D8E4EE] bg-white text-[13px] font-semibold text-[#1A3A5C] hover:bg-[#F0F5FA]"
        >
          <Plus size={14} /> Schedule
        </button>
      </CardContent>
      <AppointmentDialog draft={draft} onClose={() => setDraft(null)} lead={lead} />
    </Card>
  );
}
