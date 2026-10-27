// Sales leads: shared labels and date helpers (used by the pages, the API and the daily reminder).
// Follow-up dates are calendar days in Pacific time, stored as "YYYY-MM-DD".

export const LEAD_STAGES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number]["value"];
export const LEAD_STAGE_VALUES = LEAD_STAGES.map(s => s.value) as [LeadStage, ...LeadStage[]];

export const LEAD_SOURCES = [
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "phone", label: "Phone" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;
export const LEAD_SOURCE_VALUES = LEAD_SOURCES.map(s => s.value) as [string, ...string[]];

export const LEAD_KINDS = [
  { value: "store_partner", label: "Store" },
  { value: "advertiser", label: "Advertiser" },
] as const;
export type LeadKind = (typeof LEAD_KINDS)[number]["value"];
export const LEAD_KIND_VALUES = LEAD_KINDS.map(k => k.value) as [LeadKind, ...LeadKind[]];

/** Goal: ads live on each store's screen at once */
export const ADS_PER_STORE_GOAL = 40;

export const LEADS_PAGE_SIZE = 25;

const LEADS_TZ = "America/Los_Angeles";

/** Today in Pacific time, "YYYY-MM-DD" */
export function leadToday(now = new Date()) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: LEADS_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** "YYYY-MM-DD" plus n days */
export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function stageLabel(value: string) {
  return LEAD_STAGES.find(s => s.value === value)?.label ?? value;
}

export function sourceLabel(value: string | null) {
  return value ? LEAD_SOURCES.find(s => s.value === value)?.label ?? value : null;
}

/** Won and Lost are finished; follow-ups only matter while a lead is open */
export const isOpenStage = (stage: string) => stage !== "won" && stage !== "lost";
