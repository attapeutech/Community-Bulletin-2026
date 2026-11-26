"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const money = (c: number) => `$${(c / 100).toFixed(2)}`;
const METHODS = { cash: "Cash", zelle: "Zelle", check: "Check" } as const;

/**
 * Revenue page, store column, when the store owner was (or will be) paid outside the system:
 * shows "$50.00 paid in cash · Nov 13" with the note, or a "Record cash payment" button.
 */
export default function OfflinePaid({ paymentId, adPriceCents, offline, ownStore }: {
  paymentId: string;
  adPriceCents: number;
  offline: { cents: number; method: string | null; paidOn: string | null; note: string | null } | null;
  ownStore: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const [form, setForm] = useState({
    amount: offline ? (offline.cents / 100).toFixed(2) : (adPriceCents / 200).toFixed(2),
    method: offline?.method ?? "cash",
    paidOn: offline?.paidOn ?? today,
    note: offline?.note ?? "",
  });

  async function save(clear = false) {
    const cents = Math.round(Number(form.amount) * 100);
    if (!clear && !(cents > 0)) { setError("Enter the amount paid."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/offline-store-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clear ? { amountCents: null } : { amountCents: cents, method: form.method, paidOn: form.paidOn, note: form.note }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Couldn't save");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  const input = "h-8 px-2 text-[12px] border border-[#C9D8E6] rounded-md bg-white text-[#1A3A5C]";
  const btn = "text-[12px] font-semibold rounded-md px-2.5 py-1 border transition-colors disabled:opacity-50";

  return (
    <div className="text-[12px]">
      {offline ? (
        <>
          <div className="font-semibold text-[#1A3A5C]">{money(offline.cents)} <span className="font-normal text-[#4A6B82]">paid in {(METHODS[offline.method as keyof typeof METHODS] ?? "cash").toLowerCase()}</span></div>
          <div className="text-[#4A6B82]">
            Outside the system{offline.paidOn && ` · ${new Date(`${offline.paidOn}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </div>
          {offline.note && <div className="text-[11px] text-[#7C93A8] italic">{offline.note}</div>}
        </>
      ) : ownStore ? (
        <div className="text-[#4A6B82]">Our store: no share</div>
      ) : null}

      {!open && (
        <button onClick={() => setOpen(true)} className={`${btn} mt-1.5 bg-white text-[#1A3A5C] border-[#C9D8E6] hover:bg-[#F0F5FA]`}>
          {offline ? "Edit" : "Record cash payment"}
        </button>
      )}

      {open && (
        <div className="mt-2 flex flex-col gap-1.5 bg-[#F4F7FB] border border-[#D8E4EE] rounded-lg p-2.5 max-w-[240px]">
          <div className="text-[11px] text-[#4A6B82]">Paid to the store owner outside the system for this ad</div>
          <div className="flex gap-1.5">
            <span className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#4A6B82]">$</span>
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" className={`${input} w-[84px] pl-4`} aria-label="Amount" />
            </span>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={`${input} flex-1`} aria-label="Method">
              {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <input type="date" value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} className={input} aria-label="Date paid" />
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note (optional)" maxLength={300} className={input} />
          {error && <div className="text-[11px] text-red-700">{error}</div>}
          <div className="flex gap-1.5">
            <button onClick={() => save()} disabled={busy} className={`${btn} bg-[#1A3A5C] text-white border-[#1A3A5C]`}>{busy ? "Saving…" : "Save"}</button>
            <button onClick={() => { setOpen(false); setError(null); }} disabled={busy} className={`${btn} bg-white text-[#4A6B82] border-[#C9D8E6]`}>Cancel</button>
            {offline && <button onClick={() => save(true)} disabled={busy} className={`${btn} ml-auto bg-white text-red-700 border-red-200`}>Remove</button>}
          </div>
        </div>
      )}
    </div>
  );
}
