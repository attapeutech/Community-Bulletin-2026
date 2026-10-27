"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Mail, Plus, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ADS_PER_STORE_GOAL, LEADS_PAGE_SIZE, LEAD_KINDS, LEAD_STAGES, addDays, isOpenStage, stageLabel, type LeadStage } from "@/lib/leads";

export type LeadRow = {
  id: string;
  kind: string;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  stage: LeadStage;
  nextFollowUp: string | null;
  updatedAt: string;
  storeName: string | null;
  ownerName: string | null;
  linked: boolean;
};

export type StoreGoal = {
  id: string;
  label: string;
  live: number;           // ads live on the screen now
  pendingReview: number;  // paid, waiting for approval
  openLeads: number;      // advertiser leads still being worked for this store
  interested: number;
};

export type SalesFilters = {
  kind: string;    // store_partner | advertiser
  q: string;
  stage: string;   // open | all | a stage
  due: string;     // "" | due | overdue | today | week | none
  store: string;   // location id (advertiser leads)
  city: string;
  owner: string;   // "" | me
  sort: string;    // follow_up | updated | name | created
  page: number;
};

export const STAGE_BADGE: Record<LeadStage, string> = {
  new: "bg-blue-50 text-blue-800 border-blue-200",
  contacted: "bg-slate-100 text-slate-600 border-slate-200",
  interested: "bg-amber-50 text-amber-800 border-amber-200",
  won: "bg-green-50 text-green-800 border-green-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

const selectClass = "h-9 rounded-md border border-[#D8E4EE] bg-white px-2.5 text-[13px] text-[#1A3A5C]";

/** "Oct 28" from "2026-10-28" */
export const fmtDay = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function followUpText(day: string | null, today: string) {
  if (!day) return { text: "No follow-up set", tone: "text-[#4A6B82]" };
  if (day < today) return { text: `Overdue · ${fmtDay(day)}`, tone: "text-red-700 font-semibold" };
  if (day === today) return { text: "Follow up today", tone: "text-amber-800 font-semibold" };
  if (day === addDays(today, 1)) return { text: "Follow up tomorrow", tone: "text-[#1A3A5C]" };
  return { text: `Follow up ${fmtDay(day)}`, tone: "text-[#1A3A5C]" };
}

export async function patchLead(id: string, body: object) {
  const res = await fetch(`/api/admin/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!json?.success) throw new Error(json?.error ?? "Something went wrong");
}

function LeadCard({ lead, today }: { lead: LeadRow; today: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const fu = followUpText(lead.nextFollowUp, today);
  const open = isOpenStage(lead.stage);

  async function run(body: object, done: string) {
    setBusy(true);
    try {
      await patchLead(lead.id, body);
      toast.success(done);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  function changeStage(stage: string) {
    if (stage === "lost") {
      const reason = window.prompt("Why was it lost? (optional)");
      if (reason === null) return;
      run({ stage, lostReason: reason }, `${lead.businessName}: Lost`);
    } else {
      run({ stage }, `${lead.businessName}: ${stageLabel(stage)}`);
    }
  }

  return (
    <div className="px-4 sm:px-5 py-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-[1_1_220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/dashboard/sales/${lead.id}`} className="font-semibold text-[15px] text-[#1A3A5C] hover:underline">
              {lead.businessName}
            </Link>
            <span className={cn("text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5", STAGE_BADGE[lead.stage])}>
              {stageLabel(lead.stage)}
            </span>
            {lead.linked && <span className="text-[10px] font-semibold text-[#4A6B82] border border-[#D8E4EE] rounded-full px-2 py-0.5">account linked</span>}
          </div>
          <div className="text-[13px] text-[#4A6B82] mt-0.5">
            {[lead.contactName, lead.city].filter(Boolean).join(" · ") || "No contact details yet"}
          </div>
          {lead.kind === "advertiser" && (
            <div className="text-[12px] text-[#4A6B82] mt-0.5 flex items-center gap-1">
              <Store size={12} /> {lead.storeName ?? <span className="italic">No store chosen</span>}
            </div>
          )}
          {open && <div className={cn("text-[12px] mt-1", fu.tone)}>{fu.text}</div>}
        </div>

        {/* Tap to call / email */}
        <div className="flex gap-2 shrink-0">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} aria-label={`Call ${lead.businessName}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#D8E4EE] text-[13px] text-[#1A3A5C] no-underline hover:bg-[#F0F5FA]">
              <Phone size={14} /> Call
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} aria-label={`Email ${lead.businessName}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#D8E4EE] text-[13px] text-[#1A3A5C] no-underline hover:bg-[#F0F5FA]">
              <Mail size={14} /> Email
            </a>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          aria-label="Stage"
          value={lead.stage}
          disabled={busy}
          onChange={e => changeStage(e.target.value)}
          className={cn(selectClass, "h-8 text-[12px]")}
        >
          {LEAD_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {open && (
          <>
            <span className="text-[12px] text-[#4A6B82] ml-1">Follow up:</span>
            {[{ label: "Tomorrow", days: 1 }, { label: "+1 week", days: 7 }].map(o => (
              <button
                key={o.label}
                type="button"
                disabled={busy}
                onClick={() => run({ nextFollowUp: addDays(today, o.days) }, `Follow-up set for ${fmtDay(addDays(today, o.days))}`)}
                className="h-8 px-2.5 rounded-md border border-[#D8E4EE] bg-white text-[12px] text-[#1A3A5C] hover:bg-[#F0F5FA] disabled:opacity-50"
              >
                {o.label}
              </button>
            ))}
            <input
              type="date"
              aria-label="Pick a follow-up date"
              disabled={busy}
              value={lead.nextFollowUp ?? ""}
              onChange={e => {
                const v = e.target.value;
                // Typing a year digit by digit passes through 0002, 0020, 0202…; wait for a real date
                if (v && !/^20\d\d-/.test(v)) return;
                run({ nextFollowUp: v || null }, v ? `Follow-up set for ${fmtDay(v)}` : "Follow-up cleared");
              }}
              className={cn(selectClass, "h-8 text-[12px]")}
            />
          </>
        )}
        <Link href={`/dashboard/sales/${lead.id}`} className="ml-auto text-[12px] font-semibold text-[#4A90C4] no-underline hover:underline">
          Notes &amp; details →
        </Link>
      </div>
    </div>
  );
}

export default function SalesClient({ leads, filters, total, pages, today, summary, cities, stores }: {
  leads: LeadRow[];
  filters: SalesFilters;
  total: number;
  pages: number;
  today: string;
  summary: { dueToday: number; overdue: number; interested: number; won30: number };
  cities: string[];
  stores: StoreGoal[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);

  // Filters live in the address bar, so a view can be bookmarked or shared
  function go(changes: Partial<SalesFilters>) {
    const next = { ...filters, ...changes, page: changes.page ?? 1 };
    const p = new URLSearchParams();
    if (next.kind !== "advertiser") p.set("kind", next.kind);
    if (next.q) p.set("q", next.q);
    if (next.stage !== "open") p.set("stage", next.stage);
    if (next.due) p.set("due", next.due);
    if (next.store && next.kind === "advertiser") p.set("store", next.store);
    if (next.city) p.set("city", next.city);
    if (next.owner) p.set("owner", next.owner);
    if (next.sort !== "follow_up") p.set("sort", next.sort);
    if (next.page > 1) p.set("page", String(next.page));
    router.push(`/dashboard/sales${p.size ? `?${p}` : ""}`);
  }

  const isAdvertisers = filters.kind === "advertiser";
  const hasFilters = !!(filters.q || filters.stage !== "open" || filters.due || filters.store || filters.city || filters.owner || filters.sort !== "follow_up");
  const newLeadHref = `/dashboard/sales/new?kind=${filters.kind}${isAdvertisers && filters.store ? `&location=${filters.store}` : ""}`;
  const tiles = [
    { label: "Due today", value: summary.dueToday, active: filters.due === "today", onClick: () => go({ due: "today", stage: "open" }), tone: "text-amber-800" },
    { label: "Overdue", value: summary.overdue, active: filters.due === "overdue", onClick: () => go({ due: "overdue", stage: "open" }), tone: "text-red-700" },
    { label: "Interested", value: summary.interested, active: filters.stage === "interested" && !filters.due, onClick: () => go({ stage: "interested", due: "" }), tone: "text-[#1A3A5C]" },
    { label: "Won (30 days)", value: summary.won30, active: filters.stage === "won", onClick: () => go({ stage: "won", due: "", sort: "updated" }), tone: "text-green-800" },
  ];
  const first = total === 0 ? 0 : (filters.page - 1) * LEADS_PAGE_SIZE + 1;
  const last = Math.min(total, filters.page * LEADS_PAGE_SIZE);

  return (
    <div className="w-full">
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1">Sales</h1>
          <p className="text-[#4A6B82] text-sm">
            1. Sign up stores · 2. Sign up advertisers near each store · Goal: {ADS_PER_STORE_GOAL} live ads per store
          </p>
        </div>
        <Link href={newLeadHref} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#1A3A5C] text-white text-[13px] font-semibold no-underline">
          <Plus size={15} /> New {isAdvertisers ? "advertiser" : "store"} lead
        </Link>
      </div>

      {/* How-to, closed by default */}
      <details className="mb-5 rounded-xl border border-[#D8E4EE] bg-[#F7F9FC] px-4 py-3 text-[13px] text-[#4A6B82] leading-relaxed">
        <summary className="cursor-pointer font-semibold text-[14px] text-[#1A3A5C]">How to use Sales</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="font-semibold text-[#1A3A5C] mb-1">1 · Stores</div>
            <ol className="list-decimal pl-5 m-0 flex flex-col gap-1">
              <li>Talk to a store owner, then add a <b className="text-[#1A3A5C]">New store lead</b> with a first note and a follow-up date.</li>
              <li>After each visit or call, add a note and move the stage: New → Contacted → Interested.</li>
              <li>When they agree, link their account under <b className="text-[#1A3A5C]">Store owner account</b> (they sign up, or create it in Users → Add user).</li>
              <li>Click <b className="text-[#1A3A5C]">Set up this store</b>. The location form opens filled in; saving creates the store, makes them a store owner and marks the lead Won.</li>
            </ol>
          </div>
          <div>
            <div className="font-semibold text-[#1A3A5C] mb-1">2 · Advertisers</div>
            <ol className="list-decimal pl-5 m-0 flex flex-col gap-1">
              <li>Each store card shows live ads out of {ADS_PER_STORE_GOAL}. Click a card to see that store&apos;s leads.</li>
              <li>Visit businesses nearby and add a <b className="text-[#1A3A5C]">New advertiser lead</b> for that store.</li>
              <li>When they post an ad, link their account under <b className="text-[#1A3A5C]">Customer account</b> to see what they&apos;ve spent, and mark the lead Won.</li>
              <li>Keep going until the store reaches {ADS_PER_STORE_GOAL} live ads.</li>
            </ol>
          </div>
          <div className="sm:col-span-2">
            <div className="font-semibold text-[#1A3A5C] mb-1">Every day</div>
            <ul className="list-disc pl-5 m-0 flex flex-col gap-1">
              <li>Start with <b className="text-[#1A3A5C]">Due today</b> and <b className="text-[#1A3A5C]">Overdue</b>. The bell also reminds you each morning.</li>
              <li>Use <b className="text-[#1A3A5C]">Tomorrow</b> / <b className="text-[#1A3A5C]">+1 week</b> on a lead to set the next follow-up in one tap; Call and Email open your phone or mail app.</li>
              <li>Mark a lead Lost with a short reason (price, timing, not a fit), so you can see later what holds deals back.</li>
            </ul>
          </div>
        </div>
      </details>

      {/* Step tabs */}
      <div className="flex gap-1 mb-5 border-b border-[#D8E4EE]">
        {LEAD_KINDS.map(k => (
          <button
            key={k.value}
            type="button"
            onClick={() => { setQ(""); go({ kind: k.value, q: "", store: "", city: "", due: "", stage: "open" }); }}
            className={cn(
              "px-4 py-2 -mb-px border-b-2 text-[14px] font-semibold",
              filters.kind === k.value ? "border-[#E8563A] text-[#1A3A5C]" : "border-transparent text-[#4A6B82] hover:text-[#1A3A5C]"
            )}
          >
            {k.value === "store_partner" ? "1 · Stores" : "2 · Advertisers"}
          </button>
        ))}
      </div>

      {/* Advertisers: each store's progress toward the goal; click one to see its leads */}
      {isAdvertisers && stores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {stores.map(st => {
            const pct = Math.min(100, Math.round((st.live / ADS_PER_STORE_GOAL) * 100));
            const active = filters.store === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => go({ store: active ? "" : st.id })}
                className={cn(
                  "text-left bg-white rounded-xl border px-4 py-3 transition-colors",
                  active ? "border-[#1A3A5C]" : "border-[#D8E4EE] hover:border-[#4A90C4]"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-[14px] text-[#1A3A5C] truncate">{st.label}</span>
                  <span className="text-[13px] text-[#1A3A5C] shrink-0"><b>{st.live}</b> / {ADS_PER_STORE_GOAL} live</span>
                </div>
                <div className="h-2 rounded-full bg-[#E8EFF6] mt-2 overflow-hidden" role="progressbar" aria-valuenow={st.live} aria-valuemin={0} aria-valuemax={ADS_PER_STORE_GOAL} aria-label={`${st.label}: ${st.live} of ${ADS_PER_STORE_GOAL} ads`}>
                  <div className={cn("h-full rounded-full", pct >= 100 ? "bg-green-600" : "bg-[#E8563A]")} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[12px] text-[#4A6B82] mt-1.5">
                  {[
                    st.pendingReview > 0 && `${st.pendingReview} awaiting review`,
                    `${st.openLeads} open lead${st.openLeads !== 1 ? "s" : ""}`,
                    st.interested > 0 && `${st.interested} interested`,
                  ].filter(Boolean).join(" · ")}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Counts double as shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {tiles.map(t => (
          <button
            key={t.label}
            type="button"
            onClick={t.onClick}
            className={cn(
              "text-left bg-white rounded-xl border px-4 py-3 transition-colors",
              t.active ? "border-[#1A3A5C]" : "border-[#D8E4EE] hover:border-[#4A90C4]"
            )}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82]">{t.label}</div>
            <div className={cn("text-[24px] font-bold leading-tight", t.tone)}>{t.value}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <form
          onSubmit={e => { e.preventDefault(); go({ q: q.trim() }); }}
          className="flex-[1_1_220px] min-w-0"
        >
          <Input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name, contact, phone, email"
            className="h-9 text-[13px] bg-white border-[#D8E4EE]"
          />
        </form>
        <select aria-label="Stage" value={filters.stage} onChange={e => go({ stage: e.target.value })} className={selectClass}>
          <option value="open">Open leads</option>
          <option value="all">All stages</option>
          {LEAD_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select aria-label="Follow-up" value={filters.due} onChange={e => go({ due: e.target.value })} className={selectClass}>
          <option value="">Any follow-up</option>
          <option value="due">Due (today + overdue)</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="week">Within 7 days</option>
          <option value="none">No follow-up set</option>
        </select>
        {isAdvertisers && stores.length > 0 && (
          <select aria-label="Store" value={filters.store} onChange={e => go({ store: e.target.value })} className={selectClass}>
            <option value="">All stores</option>
            {stores.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
          </select>
        )}
        {cities.length > 0 && (
          <select aria-label="City" value={filters.city} onChange={e => go({ city: e.target.value })} className={selectClass}>
            <option value="">All cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select aria-label="Owner" value={filters.owner} onChange={e => go({ owner: e.target.value })} className={selectClass}>
          <option value="">Everyone&apos;s leads</option>
          <option value="me">My leads</option>
        </select>
        <select aria-label="Sort" value={filters.sort} onChange={e => go({ sort: e.target.value })} className={selectClass}>
          <option value="follow_up">Sort: follow-up date</option>
          <option value="updated">Sort: recently updated</option>
          <option value="created">Sort: newest</option>
          <option value="name">Sort: name</option>
        </select>
        {hasFilters && (
          <button type="button" onClick={() => { setQ(""); router.push(`/dashboard/sales${isAdvertisers ? "" : "?kind=store_partner"}`); }} className="text-[12px] text-[#4A90C4] hover:underline px-1">
            Clear filters
          </button>
        )}
      </div>

      <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="py-12 text-center text-[#4A6B82] text-sm">
              {hasFilters ? "No leads match these filters." : <>No {isAdvertisers ? "advertiser" : "store"} leads yet. <Link href={newLeadHref} className="text-[#4A90C4]">Add the first one</Link>.</>}
            </div>
          ) : (
            <div className="divide-y divide-[#D8E4EE]">
              {leads.map(l => <LeadCard key={l.id} lead={l} today={today} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between gap-3 mt-4 text-[13px] text-[#4A6B82]">
          <span>{first}–{last} of {total}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => go({ page: filters.page - 1 })}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-[#D8E4EE] bg-white text-[#1A3A5C] disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span>Page {filters.page} of {pages}</span>
            <button
              type="button"
              disabled={filters.page >= pages}
              onClick={() => go({ page: filters.page + 1 })}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-[#D8E4EE] bg-white text-[#1A3A5C] disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
