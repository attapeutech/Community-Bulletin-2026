"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { LEAD_STAGES, addDays, isOpenStage, sourceLabel, stageLabel, type LeadStage } from "@/lib/leads";
import { STAGE_BADGE, fmtDay, followUpText, patchLead } from "../SalesClient";
import { LeadForm } from "../LeadForm";
import type { StoreOption } from "../store-options";
import LeadDemos, { type LeadDemo } from "./LeadDemos";

export type LeadDetail = {
  id: string;
  kind: string;
  locationId: string | null;
  storeLabel: string | null;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  source: string | null;
  stage: LeadStage;
  nextFollowUp: string | null;
  lostReason: string | null;
  wonAt: string | null;
  createdAt: string;
  ownerName: string | null;
  customer: { name: string; email: string; role: string; count: number; cents: number; ads: number } | null;
  notes: { id: string; body: string; authorName: string | null; createdAt: string }[];
};

const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const ROLE_LABEL: Record<string, string> = { user: "User", store_owner: "Store owner", approver: "Approver", admin: "Admin" };

/** Automatic notes ("Stage: New → Won", "Store set up: … (marked Won)") show stage names as badges */
function NoteBody({ body }: { body: string }) {
  if (!/^(Stage|Store set up): /.test(body)) return <>{body}</>;
  const labels = LEAD_STAGES.map(st => st.label).join("|");
  return (
    <>
      {/* Whole words only, so a store called "Newport" isn't badged */}
      {body.split(new RegExp(`(?<![A-Za-z])(${labels})(?![A-Za-z])`)).map((part, i) => {
        const stage = LEAD_STAGES.find(st => st.label === part);
        return stage ? (
          <span key={i} className={cn("inline-block text-[10px] font-bold uppercase tracking-wide border rounded-full px-1.5 py-px align-middle", STAGE_BADGE[stage.value])}>
            {part}
          </span>
        ) : part;
      })}
    </>
  );
}

const selectClass = "h-9 rounded-md border border-[#D8E4EE] bg-white px-2.5 text-[13px] text-[#1A3A5C]";

export default function LeadDetailClient({ lead, today, stores, demos }: { lead: LeadDetail; today: string; stores: StoreOption[]; demos: LeadDemo[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [linkEmail, setLinkEmail] = useState(lead.email ?? "");
  const open = isOpenStage(lead.stage);
  const fu = followUpText(lead.nextFollowUp, today);
  const isAdvertiser = lead.kind === "advertiser";
  const back = `/dashboard/sales${isAdvertiser ? "" : "?kind=store_partner"}`;

  async function run(body: object, done: string) {
    setBusy(true);
    try {
      await patchLead(lead.id, body);
      toast.success(done);
      router.refresh();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function changeStage(stage: string) {
    if (stage === "lost") {
      const reason = window.prompt("Why was it lost? (optional)");
      if (reason === null) return;
      run({ stage, lostReason: reason }, "Marked as lost");
    } else {
      run({ stage }, `Stage: ${stageLabel(stage)}`);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error ?? "Couldn't save the note");
      setNote("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${lead.businessName} and all its notes? This can't be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!json?.success) { toast.error(json?.error ?? "Couldn't delete"); return; }
    toast.success("Lead deleted");
    router.push(back);
  }

  return (
    <div className="w-full max-w-[860px]">
      <Link href={back} className="text-[13px] text-[#4A6B82] no-underline hover:underline">← Sales</Link>

      <div className="mt-2 mb-5 flex items-center gap-2.5 flex-wrap">
        <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C]">{lead.businessName}</h1>
        <span className={cn("text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5", STAGE_BADGE[lead.stage])}>
          {stageLabel(lead.stage)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4A6B82] border border-[#D8E4EE] rounded-full px-2 py-0.5">
          {isAdvertiser ? "Advertiser" : "Store"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Details */}
          <Card className="rounded-xl border-[#D8E4EE]">
            <CardHeader className="px-5 py-4 border-b border-[#D8E4EE] flex-row items-center justify-between space-y-0">
              <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">Details</CardTitle>
              {!editing && <button type="button" onClick={() => setEditing(true)} className="text-[12px] font-semibold text-[#4A90C4] hover:underline">Edit</button>}
            </CardHeader>
            <CardContent className="p-5">
              {editing ? (
                <LeadForm
                  initial={{
                    businessName: lead.businessName,
                    contactName: lead.contactName ?? "",
                    phone: lead.phone ?? "",
                    email: lead.email ?? "",
                    city: lead.city ?? "",
                    address: lead.address ?? "",
                    source: lead.source ?? "",
                  }}
                  submitLabel="Save"
                  onCancel={() => setEditing(false)}
                  onSubmit={async v => {
                    if (await run({ ...v, source: v.source || null }, "Details saved")) setEditing(false);
                  }}
                />
              ) : (
                <div className="flex flex-col gap-3 text-[14px] text-[#1A3A5C]">
                  {lead.contactName && <div><span className="text-[#4A6B82]">Contact: </span>{lead.contactName}</div>}
                  <div className="flex gap-2 flex-wrap">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#D8E4EE] text-[13px] text-[#1A3A5C] no-underline hover:bg-[#F0F5FA]">
                        <Phone size={14} /> {lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#D8E4EE] text-[13px] text-[#1A3A5C] no-underline hover:bg-[#F0F5FA] break-all">
                        <Mail size={14} /> {lead.email}
                      </a>
                    )}
                    {(lead.address || lead.city) && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent([lead.address, lead.city].filter(Boolean).join(", "))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#D8E4EE] text-[13px] text-[#1A3A5C] no-underline hover:bg-[#F0F5FA]"
                      >
                        <MapPin size={14} /> {[lead.address, lead.city].filter(Boolean).join(", ")}
                      </a>
                    )}
                  </div>
                  <div className="text-[13px] text-[#4A6B82]">
                    {[sourceLabel(lead.source) && `Met via ${sourceLabel(lead.source)!.toLowerCase()}`, `Added ${fmtTime(lead.createdAt)}`, lead.ownerName && `by ${lead.ownerName}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isAdvertiser && (
            <LeadDemos
              leadId={lead.id}
              locationId={lead.locationId}
              storeLabel={stores.find(s => s.id === lead.locationId)?.label ?? lead.storeLabel}
              demos={demos}
            />
          )}

          {/* Notes timeline */}
          <Card className="rounded-xl border-[#D8E4EE]">
            <CardHeader className="px-5 py-4 border-b border-[#D8E4EE]">
              <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <form onSubmit={addNote} className="flex flex-col gap-2">
                <Textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What happened? What's next?" className="bg-white" />
                <div><Button type="submit" disabled={busy || !note.trim()} className="h-9 bg-[#1A3A5C] text-white text-[13px]">Add note</Button></div>
              </form>
              {lead.notes.length === 0 ? (
                <div className="text-[13px] text-[#4A6B82]">No notes yet.</div>
              ) : (
                <ol className="flex flex-col gap-3 m-0 p-0 list-none">
                  {lead.notes.map(n => (
                    <li key={n.id} className="border-l-2 border-[#D8E4EE] pl-3">
                      <div className="text-[11px] text-[#4A6B82]">{fmtTime(n.createdAt)}{n.authorName && ` · ${n.authorName}`}</div>
                      <div className="text-[14px] text-[#1A3A5C] whitespace-pre-wrap break-words"><NoteBody body={n.body} /></div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {/* Stage + follow-up */}
          <Card className="rounded-xl border-[#D8E4EE]">
            <CardContent className="p-5 flex flex-col gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] mb-1.5">Stage</div>
                <select aria-label="Stage" value={lead.stage} disabled={busy} onChange={e => changeStage(e.target.value)} className={cn(selectClass, "w-full")}>
                  {LEAD_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {lead.stage === "won" && lead.wonAt && <div className="text-[12px] text-green-800 mt-1.5">Won {fmtTime(lead.wonAt)}</div>}
                {lead.stage === "lost" && lead.lostReason && <div className="text-[12px] text-[#4A6B82] mt-1.5">Reason: {lead.lostReason}</div>}
              </div>

              {open && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] mb-1.5">Next follow-up</div>
                  <div className={cn("text-[13px] mb-2", fu.tone)}>{fu.text}</div>
                  <div className="flex gap-2 flex-wrap">
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advertiser: the store they'd advertise at. Store lead: the location it became. */}
          <Card className="rounded-xl border-[#D8E4EE]">
            <CardContent className="p-5 flex flex-col gap-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] flex items-center gap-1">
                <Store size={12} /> {isAdvertiser ? "Advertising at" : "Store location"}
              </div>
              <select
                aria-label={isAdvertiser ? "Store" : "Store location"}
                value={lead.locationId ?? ""}
                disabled={busy}
                onChange={e => run({ locationId: e.target.value || null }, e.target.value ? "Store saved" : "Store cleared")}
                className={cn(selectClass, "w-full")}
              >
                <option value="">{isAdvertiser ? "Choose a store…" : "Not set up yet"}</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                {/* Keep an inactive store visible if it's the one linked */}
                {lead.locationId && !stores.some(s => s.id === lead.locationId) && <option value={lead.locationId}>{lead.storeLabel ?? "Inactive store"}</option>}
              </select>
              {!isAdvertiser && !lead.locationId && (
                <>
                  <Link
                    href={`/dashboard/store-owner/locations/new?lead=${lead.id}`}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-[#1A3A5C] text-white text-[13px] font-semibold no-underline"
                  >
                    Set up this store →
                  </Link>
                  <div className="text-[12px] text-[#4A6B82]">
                    Opens the new-location form filled in from this lead.{!lead.customer && " Link the owner's account below first, so the store belongs to them."}
                  </div>
                </>
              )}
              {lead.locationId && (
                <div className="flex flex-col gap-1 text-[12px]">
                  <Link href={`/dashboard/sales?store=${lead.locationId}`} className="text-[#4A90C4]">Advertiser leads for this store →</Link>
                  {!isAdvertiser && (
                    <Link href={`/dashboard/sales/new?kind=advertiser&location=${lead.locationId}`} className="text-[#4A90C4]">Add an advertiser for this store →</Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer account: links the lead to the account it became (kept for sales credit later) */}
          <Card className="rounded-xl border-[#D8E4EE]">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82]">{isAdvertiser ? "Customer account" : "Store owner account"}</div>
              {lead.customer ? (
                <>
                  <div className="text-[14px] text-[#1A3A5C]">
                    <div className="font-semibold">{lead.customer.name}</div>
                    <div className="text-[12px] text-[#4A6B82] break-all">{lead.customer.email}</div>
                    {/* The card title is what the account is for; this is its actual role today */}
                    <div className="text-[12px] text-[#4A6B82] mt-0.5">
                      Role: <span className="font-semibold text-[#1A3A5C]">{ROLE_LABEL[lead.customer.role] ?? lead.customer.role}</span>
                      {!isAdvertiser && !lead.locationId && lead.customer.role === "user" && " (becomes Store owner when the store is set up)"}
                    </div>
                  </div>
                  <div className="text-[13px] text-[#1A3A5C]">
                    <span className="font-semibold text-green-800">{money(lead.customer.cents)}</span> paid · {lead.customer.ads} ad{lead.customer.ads !== 1 ? "s" : ""}
                  </div>
                  <button type="button" disabled={busy} onClick={() => run({ linkEmail: null }, "Account unlinked")} className="self-start text-[12px] text-[#4A90C4] hover:underline">
                    Unlink
                  </button>
                </>
              ) : (
                <form
                  onSubmit={e => { e.preventDefault(); if (linkEmail.trim()) run({ linkEmail: linkEmail.trim() }, "Account linked"); }}
                  className="flex flex-col gap-2"
                >
                  <div className="text-[12px] text-[#4A6B82]">
                    {isAdvertiser
                      ? <>Once they sign up, link their account to see what they&apos;ve spent.</>
                      : <>The store owner&apos;s account. They can sign up themselves, or create it in Users → Add user.</>}
                  </div>
                  <Input type="email" value={linkEmail} onChange={e => setLinkEmail(e.target.value)} placeholder="Their account email" className="h-9 text-[13px] bg-white" />
                  <Button type="submit" variant="outline" disabled={busy || !linkEmail.trim()} className="h-9 text-[13px]">Link account</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <button type="button" disabled={busy} onClick={remove} className="self-start text-[12px] text-red-700 hover:underline">
            Delete lead
          </button>
        </div>
      </div>
    </div>
  );
}
