"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addDays, type LeadKind } from "@/lib/leads";
import { EMPTY_LEAD, LeadForm } from "../LeadForm";
import type { StoreOption } from "../store-options";

const fieldLabel = "block mb-1.5 text-[11px] font-semibold text-[#4A6B82] uppercase tracking-[0.04em]";

export default function NewLeadClient({ today, stores, initialKind, initialLocationId }: {
  today: string;
  stores: StoreOption[];
  initialKind: LeadKind;
  initialLocationId: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<LeadKind>(initialKind);
  const [locationId, setLocationId] = useState(initialLocationId);
  // Default: check back in a few days
  const [nextFollowUp, setNextFollowUp] = useState(addDays(today, 3));
  const [note, setNote] = useState("");
  const isAdvertiser = kind === "advertiser";
  const back = `/dashboard/sales${isAdvertiser ? (locationId ? `?store=${locationId}` : "") : "?kind=store_partner"}`;

  return (
    <div className="w-full max-w-[720px]">
      <Link href={back} className="text-[13px] text-[#4A6B82] no-underline hover:underline">← Sales</Link>
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mt-2 mb-5">New lead</h1>
      <Card className="rounded-xl border-[#D8E4EE]">
        <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
          {/* Which step of the process */}
          <div>
            <Label className={fieldLabel}>Type</Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: "store_partner", label: "Store", hint: "a store that could host a screen" },
                { value: "advertiser", label: "Advertiser", hint: "a business near one of our stores" },
              ] as const).map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setKind(o.value)}
                  className={cn(
                    "text-left px-3.5 py-2 rounded-lg border text-[13px]",
                    kind === o.value ? "bg-[#1A3A5C] border-[#1A3A5C] text-white" : "bg-white border-[#D8E4EE] text-[#1A3A5C] hover:border-[#1A3A5C]"
                  )}
                >
                  <div className="font-semibold">{o.label}</div>
                  <div className={cn("text-[11px]", kind === o.value ? "text-white/80" : "text-[#4A6B82]")}>{o.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {isAdvertiser && (
            <div>
              <Label className={fieldLabel}>Store they&apos;d advertise at</Label>
              {stores.length === 0 ? (
                <div className="text-[13px] text-[#4A6B82]">No active stores yet. Sign up a store first.</div>
              ) : (
                <select value={locationId} onChange={e => setLocationId(e.target.value)} className="h-10 w-full rounded-md border border-[#D8E4EE] bg-white px-2.5 text-sm text-[#1A3A5C]">
                  <option value="">Choose a store…</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              )}
            </div>
          )}

          <LeadForm
            initial={EMPTY_LEAD}
            submitLabel={isAdvertiser ? "Add advertiser lead" : "Add store lead"}
            onCancel={() => router.push(back)}
            extra={
              <>
                <div>
                  <Label className={fieldLabel}>Next follow-up</Label>
                  <Input type="date" value={nextFollowUp} onChange={e => setNextFollowUp(e.target.value)} className="h-10 w-48 bg-white" />
                </div>
                <div>
                  <Label className={fieldLabel}>First note</Label>
                  <Textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What did you talk about? What do they need?" className="bg-white" />
                </div>
              </>
            }
            onSubmit={async v => {
              const res = await fetch("/api/admin/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...v,
                  kind,
                  locationId: isAdvertiser && locationId ? locationId : null,
                  source: v.source || null,
                  nextFollowUp: nextFollowUp || null,
                  note,
                }),
              });
              const json = await res.json().catch(() => null);
              if (!json?.success) {
                toast.error(json?.error ?? "Couldn't add the lead");
                return;
              }
              toast.success(`${v.businessName} added`);
              router.push(`/dashboard/sales/${json.data.id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
