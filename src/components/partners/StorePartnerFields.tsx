"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HAS_SCREEN, LOCATION_COUNTS, STORE_TYPES } from "@/lib/partner-application-schema";
import { cn } from "@/lib/utils";

export type StorePartnerValues = {
  businessName: string;
  contactName: string;
  phone: string;
  storeType: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  locationsCount: string;
  hasScreen: string;
  notes: string;
};

export const EMPTY_STORE_PARTNER: StorePartnerValues = {
  businessName: "", contactName: "", phone: "", storeType: "", addressLine1: "",
  city: "", state: "", postalCode: "", locationsCount: "1", hasScreen: "", notes: "",
};

const labelCls = "block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]";
const selectCls = "w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";

/** Store details for a store partner application. Errors are keyed by field name. */
export function StorePartnerFields({
  value, onChange, errors = {},
}: {
  value: StorePartnerValues;
  onChange: (next: StorePartnerValues) => void;
  errors?: Partial<Record<keyof StorePartnerValues, string>>;
}) {
  const set = <K extends keyof StorePartnerValues>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ ...value, [k]: e.target.value });
  const err = (k: keyof StorePartnerValues) => errors[k] && <p className="text-xs text-destructive mt-1">{errors[k]}</p>;
  const bad = (k: keyof StorePartnerValues) => (errors[k] ? "border-destructive bg-destructive/5" : "");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className={labelCls}>Store / business name</Label>
        <Input value={value.businessName} onChange={set("businessName")} placeholder="e.g. Lynnwood Corner Market" className={bad("businessName")} />
        {err("businessName")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className={labelCls}>Contact name</Label>
          <Input value={value.contactName} onChange={set("contactName")} placeholder="Owner or manager" className={bad("contactName")} />
          {err("contactName")}
        </div>
        <div>
          <Label className={labelCls}>Phone</Label>
          <Input type="tel" value={value.phone} onChange={set("phone")} placeholder="(555) 123-4567" className={bad("phone")} />
          {err("phone")}
        </div>
      </div>

      <div>
        <Label className={labelCls}>Store type</Label>
        <select value={value.storeType} onChange={set("storeType")} className={cn(selectCls, bad("storeType"))}>
          <option value="">Choose…</option>
          {STORE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {err("storeType")}
      </div>

      <div>
        <Label className={labelCls}>Store address</Label>
        <Input value={value.addressLine1} onChange={set("addressLine1")} placeholder="Street address" className={bad("addressLine1")} />
        {err("addressLine1")}
      </div>
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-6 sm:col-span-3">
          <Input value={value.city} onChange={set("city")} placeholder="City" className={bad("city")} />
          {err("city")}
        </div>
        <div className="col-span-3 sm:col-span-1 min-w-[64px]">
          <Input value={value.state} onChange={set("state")} placeholder="State" maxLength={50} className={cn("px-2.5", bad("state"))} />
          {err("state")}
        </div>
        <div className="col-span-3 sm:col-span-2">
          <Input value={value.postalCode} onChange={set("postalCode")} placeholder="ZIP" className={bad("postalCode")} />
          {err("postalCode")}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <Label className={labelCls}>Number of stores</Label>
          <select value={value.locationsCount} onChange={set("locationsCount")} className={cn(selectCls, bad("locationsCount"))}>
            {LOCATION_COUNTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {err("locationsCount")}
        </div>
        <div>
          <Label className={labelCls}>Have a TV to use?</Label>
          <select value={value.hasScreen} onChange={set("hasScreen")} className={cn(selectCls, bad("hasScreen"))}>
            <option value="">Choose…</option>
            {HAS_SCREEN.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {err("hasScreen")}
        </div>
      </div>

      <div>
        <Label className={labelCls}>Anything else? <span className="normal-case font-normal tracking-normal text-muted-foreground">(optional)</span></Label>
        <textarea
          value={value.notes}
          onChange={set("notes")}
          rows={3}
          placeholder="Best time to reach you, other locations, questions…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
    </div>
  );
}

/** Validates with the shared schema; returns field errors (empty object = valid). */
export function validateStorePartner(
  schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } } },
  value: StorePartnerValues,
) {
  const result = schema.safeParse({ ...value, notes: value.notes || undefined });
  if (result.success) return {} as Partial<Record<keyof StorePartnerValues, string>>;
  const errors: Partial<Record<keyof StorePartnerValues, string>> = {};
  for (const issue of result.error!.issues) {
    const key = issue.path[0] as keyof StorePartnerValues;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
