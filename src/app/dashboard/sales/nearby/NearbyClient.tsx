"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, MapPin, Phone, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Business = {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  distanceMi: number;
  chain: boolean;
  leadId: string | null;   // already an advertiser lead
};

const btnOutline = "inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#D8E4EE] bg-white text-[13px] font-semibold text-[#1A3A5C] hover:bg-[#F0F5FA] disabled:opacity-50 dark:bg-transparent dark:text-[#E6EEF6] dark:border-[#33557A] dark:hover:bg-[#2A5179]";

export default function NearbyClient({ stores, initialStore, configured }: {
  stores: { id: string; label: string }[];
  initialStore: string;
  configured: boolean;
}) {
  const router = useRouter();
  const [store, setStore] = useState(initialStore);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [results, setResults] = useState<Business[] | null>(null);
  const [storeLine, setStoreLine] = useState<string | null>(null);
  const [showChains, setShowChains] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  async function find(id = store) {
    if (!id) return;
    setLoading(true);
    setResults(null);
    setTicked(new Set());
    try {
      const res = await fetch(`/api/admin/leads/nearby?store=${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResults(json.data.results);
      setStoreLine(`${json.data.store.name} · ${json.data.store.address}`);
    } catch (e: any) {
      toast.error(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  // Search right away when opened for a store (e.g. from the Sales list)
  useEffect(() => { if (configured && initialStore) find(initialStore); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => (results ?? []).filter((b) => showChains || !b.chain), [results, showChains]);
  const addable = shown.filter((b) => !b.leadId);
  const chainCount = (results ?? []).filter((b) => b.chain).length;
  const allTicked = addable.length > 0 && addable.every((b) => ticked.has(b.placeId));

  function toggle(id: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function addLeads() {
    const chosen = (results ?? []).filter((b) => ticked.has(b.placeId) && !b.leadId);
    if (!chosen.length) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/leads/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store, businesses: chosen.map(({ leadId: _l, chain: _c, ...b }) => b) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const { added, skipped } = json.data;
      toast.success(`${added} lead${added === 1 ? "" : "s"} added${skipped ? ` (${skipped} already in the pipeline)` : ""}`);
      router.refresh();
      await find();
    } catch (e: any) {
      toast.error(e.message || "Couldn't add the leads");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="w-full max-w-[1000px]">
      <Link
        href={`/dashboard/sales${store ? `?store=${store}` : ""}`}
        className="group no-underline inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1A3A5C] bg-white border border-[#C9D9E7] rounded-full pl-2.5 pr-3.5 py-1.5 shadow-sm hover:bg-[#1A3A5C] hover:text-white hover:border-[#1A3A5C] transition-colors"
      >
        <ArrowLeft size={15} strokeWidth={2.4} className="text-[#E8563A] group-hover:text-white" aria-hidden="true" /> Sales
      </Link>
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mt-2 mb-1">Find nearby businesses</h1>
      <p className="text-sm text-[#4A6B82] mb-5">
        Local businesses within a mile of a store, closest first (from Google Maps). Tick the ones worth contacting and add them as
        advertiser leads for that store; then use Call, demo ads and Pay now as usual.
      </p>

      {!configured ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Google Places isn&apos;t set up yet. Add <code>GOOGLE_PLACES_API_KEY</code> to <code>.env.local</code> (and Coolify), then restart.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <select
              value={store}
              onChange={(e) => { setStore(e.target.value); find(e.target.value); }}
              className="h-9 rounded-md border border-[#D1DDE8] bg-white px-2.5 text-base sm:text-sm text-[#1A3A5C] dark:bg-transparent dark:text-[#E6EEF6] dark:border-[#33557A] min-w-[220px]"
              aria-label="Store"
            >
              {stores.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button type="button" onClick={() => find()} disabled={loading} className={btnOutline}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {results ? "Search again" : "Find businesses"}
            </button>
            {chainCount > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-[#4A6B82] cursor-pointer ml-1">
                <input type="checkbox" checked={showChains} onChange={(e) => setShowChains(e.target.checked)} />
                Show chains ({chainCount})
              </label>
            )}
          </div>
          {storeLine && <p className="text-xs text-[#6B7A8C] mb-3 flex items-center gap-1"><MapPin size={12} className="text-[#E8563A]" /> {storeLine}</p>}

          {loading && <div className="py-10 text-center text-sm text-[#4A6B82]"><Loader2 className="inline animate-spin mr-2" size={16} />Looking up nearby businesses…</div>}

          {results && !loading && (
            <div className="bg-white rounded-xl border border-[#D8E4EE] overflow-hidden">
              {/* Count, Select all, Add — stays on top while scrolling */}
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#F7FAFC] border-b border-[#E5EDF4]">
                <span className="text-xs text-[#4A6B82]">
                  <strong className="text-[#1A3A5C]">{shown.length}</strong> businesses · {shown.length - addable.length} already leads ·{" "}
                  <strong className="text-[#1A3A5C]">{ticked.size}</strong> ticked
                </span>
                <span className="flex gap-2">
                  {addable.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTicked(allTicked ? new Set() : new Set(addable.map((b) => b.placeId)))}
                      className={btnOutline}
                    >
                      {allTicked ? "Untick all" : `Tick all ${addable.length}`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addLeads}
                    disabled={!ticked.size || adding}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-semibold bg-[#E8563A] text-white hover:bg-[#D04530] disabled:opacity-50"
                  >
                    {adding && <Loader2 size={14} className="animate-spin" />} Add {ticked.size || ""} as lead{ticked.size === 1 ? "" : "s"}
                  </button>
                </span>
              </div>

              {!shown.length && <div className="p-8 text-center text-sm text-[#4A6B82]">No businesses found within a mile.</div>}

              <ul className="divide-y divide-[#EEF3F8]">
                {shown.map((b) => (
                  <li key={b.placeId} className={cn("flex items-start gap-3 px-4 py-3", b.leadId && "opacity-60")}>
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 accent-[#1A3A5C]"
                      checked={ticked.has(b.placeId)}
                      disabled={!!b.leadId}
                      onChange={() => toggle(b.placeId)}
                      aria-label={`Add ${b.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#1A3A5C]">{b.name}</span>
                        {b.category && <span className="text-[11px] text-[#4A6B82] border border-[#D8E4EE] rounded-full px-2 py-0.5">{b.category}</span>}
                        {b.chain && <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">chain</span>}
                        {b.leadId && (
                          <Link href={`/dashboard/sales/${b.leadId}`} className="text-[11px] font-semibold text-green-800 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 no-underline">
                            already a lead ↗
                          </Link>
                        )}
                      </div>
                      <div className="text-xs text-[#4A6B82] mt-0.5">{b.distanceMi} mi · {b.address ?? "address not listed"}</div>
                      <div className="text-xs mt-0.5 flex flex-wrap gap-x-3">
                        {b.phone ? <a href={`tel:${b.phone}`} className="text-[#4A90C4] inline-flex items-center gap-1"><Phone size={11} /> {b.phone}</a> : <span className="text-[#9AA7B5]">no phone listed</span>}
                        {b.website && (
                          <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-[#4A90C4] inline-flex items-center gap-1 break-all">
                            <ExternalLink size={11} /> {b.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
