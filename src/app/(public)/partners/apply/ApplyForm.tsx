"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StorePartnerFields, EMPTY_STORE_PARTNER, validateStorePartner, type StorePartnerValues } from "@/components/partners/StorePartnerFields";
import { partnerApplicationSchema } from "@/lib/partner-application-schema";

export default function ApplyForm({ defaultContactName }: { defaultContactName: string }) {
  const router = useRouter();
  const [store, setStore] = useState<StorePartnerValues>({ ...EMPTY_STORE_PARTNER, contactName: defaultContactName });
  const [errors, setErrors] = useState<Partial<Record<keyof StorePartnerValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errs = validateStorePartner(partnerApplicationSchema, store);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...store, notes: store.notes || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) {
        setFormError(json?.error ?? "Could not submit your application. Please try again.");
        return;
      }
      toast.success("Application received", { description: "We'll review your store and be in touch soon." });
      router.refresh();
    } catch {
      setFormError("Could not submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-xl border border-[#D8E4EE] dark:border-[#1E3550] bg-white dark:bg-[#0F1E2E] p-5 sm:p-6">
      <div className="font-serif font-bold text-[17px] text-[#1A3A5C] dark:text-white mb-4">Your store</div>
      <StorePartnerFields value={store} onChange={setStore} errors={errors} />
      {formError && <p className="text-[13px] text-red-700 mt-4 mb-0">{formError}</p>}
      <Button type="submit" disabled={submitting} className="w-full h-11 mt-5">
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
      <p className="text-[12px] text-[#4A6B82] mt-3 mb-0 text-center">We review every store and will be in touch soon.</p>
    </form>
  );
}
