import { SALES_EMAIL } from "@/lib/leads";

// Sales calendar appointment types, with their colours on the calendar (pale fill + dark text;
// in dark mode a soft tint with light text, like the site's other status chips)
export const APPOINTMENT_TYPES = [
  { value: "visit",   label: "Visit",   chip: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-400/40" },
  { value: "call",    label: "Call",    chip: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/40" },
  { value: "demo",    label: "Demo",    chip: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-400/40" },
  { value: "meeting", label: "Meeting", chip: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/40" },
] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number]["value"];
export const APPOINTMENT_TYPE_VALUES = APPOINTMENT_TYPES.map(t => t.value) as [AppointmentType, ...AppointmentType[]];

export const appointmentType = (value: string) => APPOINTMENT_TYPES.find(t => t.value === value) ?? APPOINTMENT_TYPES[0];

/** Follow-up dates (from the lead) look like this on the calendar */
export const FOLLOW_UP_CHIP = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-100 dark:border-white/20";

export type Appointment = {
  id: string;
  leadId: string;
  businessName: string;
  leadKind: string;
  type: string;
  startsAt: string;   // ISO
  endsAt: string;     // ISO
  place: string | null;
  notes: string | null;
};

/** "20261105T170000Z", the format Google Calendar links use */
const gcalTime = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Opens Google Calendar (the sales account) with the appointment filled in, ready to save */
export function googleCalendarUrl(a: Appointment) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${appointmentType(a.type).label}: ${a.businessName}`,
    dates: `${gcalTime(a.startsAt)}/${gcalTime(a.endsAt)}`,
    details: [a.notes, "Community Bulletin · Sales"].filter(Boolean).join("\n\n"),
    authuser: SALES_EMAIL,
  });
  if (a.place) q.set("location", a.place);
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Local calendar day of a time, "YYYY-MM-DD" (the browser's time zone) */
export function localDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2:30 PM" */
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
