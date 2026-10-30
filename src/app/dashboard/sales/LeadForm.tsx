"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEAD_SOURCES } from "@/lib/leads";

export type LeadDetails = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  source: string;
};

export const EMPTY_LEAD: LeadDetails = { businessName: "", contactName: "", phone: "", email: "", city: "", address: "", source: "" };

const fieldLabel = "block mb-1.5 text-[11px] font-semibold text-[#4A6B82] uppercase tracking-[0.04em]";
const selectClass = "h-10 w-full rounded-md border border-[#D8E4EE] bg-white px-2.5 text-sm text-[#1A3A5C]";

/** Business and contact fields, shared by New lead and Edit details. `extra` renders above the buttons. */
export function LeadForm({ initial, submitLabel, onSubmit, onCancel, onChange, extra }: {
  initial: LeadDetails;
  submitLabel: string;
  onSubmit: (values: LeadDetails) => Promise<void>;
  onCancel?: () => void;
  onChange?: (values: LeadDetails) => void;  // lets New lead keep a draft per type
  extra?: React.ReactNode;
}) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof LeadDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = { ...v, [k]: e.target.value };
    setV(next);
    onChange?.(next);
  };

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        setBusy(true);
        try { await onSubmit(v); } finally { setBusy(false); }
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Label className={fieldLabel}>Business name *</Label>
        <Input required value={v.businessName} onChange={set("businessName")} placeholder="e.g. Joe's Pizza" className="h-10 bg-white" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className={fieldLabel}>Contact person</Label>
          <Input value={v.contactName} onChange={set("contactName")} placeholder="Owner or manager" className="h-10 bg-white" />
        </div>
        <div>
          <Label className={fieldLabel}>Phone</Label>
          <Input type="tel" value={v.phone} onChange={set("phone")} placeholder="(555) 123-4567" className="h-10 bg-white" />
        </div>
        <div>
          <Label className={fieldLabel}>Email</Label>
          <Input type="email" value={v.email} onChange={set("email")} placeholder="name@business.com" className="h-10 bg-white" />
        </div>
        <div>
          <Label className={fieldLabel}>City</Label>
          <Input value={v.city} onChange={set("city")} placeholder="e.g. Lynnwood" className="h-10 bg-white" />
        </div>
        <div>
          <Label className={fieldLabel}>Address</Label>
          <Input value={v.address} onChange={set("address")} placeholder="Street address (optional)" className="h-10 bg-white" />
        </div>
        <div>
          <Label className={fieldLabel}>How we met</Label>
          <select value={v.source} onChange={set("source")} className={selectClass}>
            <option value="">—</option>
            {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      {extra}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="h-10 bg-[#1A3A5C] text-white">{busy ? "Saving…" : submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" disabled={busy} onClick={onCancel} className="h-10">Cancel</Button>}
      </div>
    </form>
  );
}
