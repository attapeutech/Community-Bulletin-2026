"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatTaxRate, taxCentsFor } from "@/lib/sales-tax";

export type StoreTaxRow = {
  id: string;
  storeName: string;
  storeNumber: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  isActive: boolean;
  priceCents: number;
  taxRateBps: number | null;
  taxLocationCode: string | null;
  taxAreaName: string | null;
  taxRatePeriod: string | null;
  taxRateCheckedAt: string | null;
  county: string | null;
};

export type TaxReportRow = {
  locationCode: string | null;
  areaName: string | null;
  rateBps: number | null;
  payments: number;
  salesCents: number;
  taxCents: number;
  county: string | null;
};

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const storeLabel = (s: { storeName: string; storeNumber: string | null }) =>
  s.storeName.trim() + (s.storeNumber ? ` #${s.storeNumber.replace(/^#/, "")}` : "");

const card = "bg-white border border-[#D8E4EE] rounded-xl p-5 mb-6";
const th = "text-left text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] py-2 px-2 border-b border-[#D8E4EE]";
const td = "py-2.5 px-2 border-b border-[#EEF3F8] align-top text-[13px] text-[#1A3A5C]";
const btn = "text-[13px] font-semibold rounded-lg px-3 py-1.5 border transition-colors disabled:opacity-50";

export default function TaxesClient({ stores, report, quarter, quarters }: {
  stores: StoreTaxRow[]; report: TaxReportRow[]; quarter: string; quarters: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [manual, setManual] = useState({ rate: "", area: "", code: "" });

  async function lookup(locationId?: string) {
    setBusy(locationId ?? "all");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/tax-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationId ? { locationId } : {}),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Lookup failed");
      const results = json.data as { ok: boolean; storeName: string; error?: string; rateBps?: number; areaName?: string }[];
      const failed = results.filter((r) => !r.ok);
      setMessage(failed.length
        ? { ok: false, text: failed.map((f) => `${f.storeName}: ${f.error}`).join(" · ") }
        : { ok: true, text: results.length === 1
            ? `${results[0].storeName}: ${formatTaxRate(results[0].rateBps!)} (${results[0].areaName})`
            : `Updated ${results.length} stores from WA DOR.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Lookup failed" });
    } finally {
      setBusy(null);
    }
  }

  async function saveManual(locationId: string) {
    const rate = manual.rate.trim() === "" ? null : Number(manual.rate);
    if (rate !== null && !(rate >= 0 && rate <= 20)) { setMessage({ ok: false, text: "Enter a rate between 0 and 20 (percent), or leave it empty for no tax." }); return; }
    setBusy(locationId);
    try {
      const res = await fetch("/api/admin/tax-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, ratePercent: rate, areaName: manual.area, locationCode: manual.code }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Couldn't save");
      setEditing(null);
      setMessage({ ok: true, text: "Saved." });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Couldn't save" });
    } finally {
      setBusy(null);
    }
  }

  // Report: grouped by county, then taxing area (DOR location code), as the WA excise tax return asks
  const taxed = report.filter((r) => r.taxCents > 0);
  const untaxed = report.filter((r) => r.taxCents === 0);
  const byCounty = new Map<string, TaxReportRow[]>();
  for (const r of taxed) {
    const k = r.county ?? "Other";
    byCounty.set(k, [...(byCounty.get(k) ?? []), r]);
  }
  const sum = (rows: TaxReportRow[], k: "payments" | "salesCents" | "taxCents") => rows.reduce((a, r) => a + r[k], 0);

  return (
    <>
      {message && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-[13px] border ${message.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
          {message.text}
        </div>
      )}

      {/* ── Store rates ── */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#1A3A5C]">Store tax rates</h2>
            <p className="text-[12px] text-[#4A6B82]">From the WA Department of Revenue by street address. Rates can change each quarter (Jan, Apr, Jul, Oct): refresh then.</p>
          </div>
          <button
            onClick={() => lookup()}
            disabled={!!busy}
            className={`${btn} bg-[#1A3A5C] text-white border-[#1A3A5C] hover:bg-[#244C74]`}
          >
            {busy === "all" ? "Looking up…" : "↻ Refresh all from WA DOR"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className={th}>Store</th>
                <th className={th}>Taxing area</th>
                <th className={th}>Rate</th>
                <th className={th}>Customer pays</th>
                <th className={th}>Checked</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => {
                const address = `${s.street.trim()}, ${s.city}, ${s.state} ${s.zip}`;
                const tax = taxCentsFor(s.priceCents, s.taxRateBps);
                return (
                  <tr key={s.id} className={s.isActive ? "" : "opacity-60"}>
                    <td className={td}>
                      <div className="font-semibold">{storeLabel(s)}{!s.isActive && <span className="ml-1.5 text-[11px] text-[#4A6B82]">(inactive)</span>}</div>
                      <a href={mapsUrl(address)} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#4A6B82] hover:text-[#E8563A] no-underline">
                        <span className="text-[#E8563A]">📍</span> {address}
                      </a>
                    </td>
                    <td className={td}>
                      {s.taxAreaName ? (
                        <>
                          <div>{s.taxAreaName}</div>
                          <div className="text-[11px] text-[#4A6B82]">{[s.county, s.taxLocationCode && `code ${s.taxLocationCode}`].filter(Boolean).join(" · ")}</div>
                        </>
                      ) : s.taxRateBps ? <span className="text-[#4A6B82]">Set by hand</span> : <span className="text-amber-700 font-semibold">Not set: no tax charged</span>}
                    </td>
                    <td className={`${td} font-bold`}>{s.taxRateBps ? formatTaxRate(s.taxRateBps) : "—"}</td>
                    <td className={td}>
                      {money(s.priceCents)}{tax > 0 && <> + {money(tax)} = <strong>{money(s.priceCents + tax)}</strong></>}
                    </td>
                    <td className={`${td} text-[12px] text-[#4A6B82]`}>
                      {s.taxRateCheckedAt ? new Date(s.taxRateCheckedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      {s.taxRatePeriod && <div className="text-[11px]">{s.taxRatePeriod === "manual" ? "entered by hand" : s.taxRatePeriod.replace(/^(Q\d)(\d{4})$/, "$1 $2")}</div>}
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <button onClick={() => lookup(s.id)} disabled={!!busy} className={`${btn} bg-white text-[#1A3A5C] border-[#C9D8E6] hover:bg-[#F0F5FA] mr-1.5`}>
                        {busy === s.id ? "…" : "↻"}
                      </button>
                      <button
                        onClick={() => { setEditing(editing === s.id ? null : s.id); setManual({ rate: s.taxRateBps ? String(s.taxRateBps / 100) : "", area: s.taxAreaName ?? "", code: s.taxLocationCode ?? "" }); }}
                        className={`${btn} bg-white text-[#4A6B82] border-[#C9D8E6] hover:bg-[#F0F5FA]`}
                      >
                        Edit
                      </button>
                      {editing === s.id && (
                        <div className="mt-2 flex flex-wrap justify-end gap-1.5 text-left">
                          <input value={manual.rate} onChange={(e) => setManual({ ...manual, rate: e.target.value })} placeholder="Rate %" inputMode="decimal" className="w-[72px] h-8 px-2 text-[13px] border border-[#C9D8E6] rounded-md bg-white text-[#1A3A5C]" />
                          <input value={manual.area} onChange={(e) => setManual({ ...manual, area: e.target.value })} placeholder="Area (e.g. Everett)" className="w-[150px] h-8 px-2 text-[13px] border border-[#C9D8E6] rounded-md bg-white text-[#1A3A5C]" />
                          <input value={manual.code} onChange={(e) => setManual({ ...manual, code: e.target.value })} placeholder="Code" className="w-[64px] h-8 px-2 text-[13px] border border-[#C9D8E6] rounded-md bg-white text-[#1A3A5C]" />
                          <button onClick={() => saveManual(s.id)} disabled={!!busy} className={`${btn} bg-[#E8563A] text-white border-[#E8563A]`}>Save</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tax collected ── */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#1A3A5C]">Tax collected by county and city</h2>
            <p className="text-[12px] text-[#4A6B82]">Paid ads in the quarter (Pacific time), by taxing area. Refunded payments are left out. Use these totals, by location code, on the WA excise tax return.</p>
          </div>
          <select
            value={quarter}
            onChange={(e) => router.push(`/dashboard/admin/taxes?q=${e.target.value}`)}
            className="h-9 px-2 text-[13px] border border-[#C9D8E6] rounded-lg bg-white text-[#1A3A5C]"
          >
            {quarters.map((q) => <option key={q} value={q}>{q.replace("-", " ")}</option>)}
          </select>
        </div>

        {report.length === 0 ? (
          <p className="text-[13px] text-[#4A6B82] py-4">No paid ads in {quarter.replace("-", " ")}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[620px]">
              <thead>
                <tr>
                  <th className={th}>Taxing area</th>
                  <th className={th}>Code</th>
                  <th className={th}>Rate</th>
                  <th className={`${th} text-right`}>Paid ads</th>
                  <th className={`${th} text-right`}>Ad sales (before tax)</th>
                  <th className={`${th} text-right`}>Tax collected</th>
                </tr>
              </thead>
              <tbody>
                {[...byCounty.entries()].map(([county, rows]) => (
                  <CountyRows key={county} county={county} rows={rows} sum={sum} />
                ))}
                {untaxed.length > 0 && (
                  <tr>
                    <td className={`${td} text-[#4A6B82]`} colSpan={3}>No tax charged (paid before tax was set up for the store)</td>
                    <td className={`${td} text-right`}>{sum(untaxed, "payments")}</td>
                    <td className={`${td} text-right`}>{money(sum(untaxed, "salesCents"))}</td>
                    <td className={`${td} text-right text-[#4A6B82]`}>{money(0)}</td>
                  </tr>
                )}
                <tr>
                  <td className={`${td} font-bold border-t-2 border-[#D8E4EE]`} colSpan={3}>Total</td>
                  <td className={`${td} font-bold text-right border-t-2 border-[#D8E4EE]`}>{sum(report, "payments")}</td>
                  <td className={`${td} font-bold text-right border-t-2 border-[#D8E4EE]`}>{money(sum(report, "salesCents"))}</td>
                  <td className={`${td} font-bold text-right border-t-2 border-[#D8E4EE] text-[#E8563A]`}>{money(sum(report, "taxCents"))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function CountyRows({ county, rows, sum }: {
  county: string;
  rows: TaxReportRow[];
  sum: (rows: TaxReportRow[], k: "payments" | "salesCents" | "taxCents") => number;
}) {
  return (
    <>
      <tr className="bg-[#F4F7FB]">
        <td className={`${td} font-bold`} colSpan={3}>{county}</td>
        <td className={`${td} font-semibold text-right`}>{sum(rows, "payments")}</td>
        <td className={`${td} font-semibold text-right`}>{money(sum(rows, "salesCents"))}</td>
        <td className={`${td} font-semibold text-right`}>{money(sum(rows, "taxCents"))}</td>
      </tr>
      {rows.map((r) => (
        <tr key={`${r.locationCode}-${r.rateBps}-${r.areaName}`}>
          <td className={`${td} pl-6`}>{r.areaName ?? "—"}</td>
          <td className={td}>{r.locationCode ?? "—"}</td>
          <td className={td}>{r.rateBps ? formatTaxRate(r.rateBps) : "—"}</td>
          <td className={`${td} text-right`}>{r.payments}</td>
          <td className={`${td} text-right`}>{money(r.salesCents)}</td>
          <td className={`${td} text-right`}>{money(r.taxCents)}</td>
        </tr>
      ))}
    </>
  );
}
