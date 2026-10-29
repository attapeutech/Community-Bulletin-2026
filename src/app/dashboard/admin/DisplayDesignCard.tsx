"use client";

import { useEffect, useState } from "react";
import { MonitorPlay } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Design = "classic" | "brand";
type Store = { id: string; storeName: string; storeNumber: string | null; slug: string };

// Admin switch between the current screen design and the new "Clean channel" brand design,
// with preview links that show either design on any device without changing the store TVs
export function DisplayDesignCard() {
  const [design, setDesign] = useState<Design | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/display-design")
      .then(r => r.json())
      .then(json => json.success && setDesign(json.data.design))
      .catch(() => setMessage({ ok: false, text: "Could not load the setting." }));
    fetch("/api/locations")
      .then(r => r.json())
      .then(json => json.success && setStores([...json.data].sort((a: Store, b: Store) => a.storeName.localeCompare(b.storeName))))
      .catch(() => {});
  }, []);

  async function switchTo(next: Design) {
    const label = next === "brand" ? "the new design" : "the current design";
    if (!window.confirm(`Switch every store screen to ${label}? Screens change within seconds; you can switch back any time.`)) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings/display-design", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: next }),
      });
      const json = await res.json();
      if (json.success) setDesign(next);
      setMessage(json.success
        ? { ok: true, text: `Store screens now use ${label}.` }
        : { ok: false, text: json.error ?? "Could not save." });
    } catch {
      setMessage({ ok: false, text: "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const link = "text-[12px] font-semibold text-[#4A90C4] hover:underline";

  return (
    <Card className="rounded-xl border-[#D8E4EE] overflow-hidden mt-5">
      <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
        <CardTitle className="font-serif text-[17px] text-[#1A3A5C] flex items-center gap-2">
          <MonitorPlay size={17} className="text-[#E8563A]" />
          Screen design
        </CardTitle>
        <p className="text-xs text-[#4A6B82] mt-1">
          The new &ldquo;Clean channel&rdquo; design adds the Community Bulletin brand bar to every slide and a coral sweep between ads.
          Preview it on any laptop or phone first: previews don&apos;t change the store TVs and don&apos;t count as ad views.
        </p>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-4">
        {!design ? (
          <div className="text-sm text-[#4A6B82]">{message?.text ?? "Loading…"}</div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px] text-[#1A3A5C]">
                Store screens show: <b>{design === "brand" ? "New design (Clean channel)" : "Current design"}</b>
              </span>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => switchTo(design === "brand" ? "classic" : "brand")}
                className="h-8 text-[12px] font-semibold border-[#D8E4EE] text-[#1A3A5C]"
              >
                {design === "brand" ? "Switch back to the current design" : "Switch all screens to the new design"}
              </Button>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Preview the new design</div>
              <div className="flex flex-col gap-1.5">
                {stores.map(st => (
                  <div key={st.id} className="flex items-center gap-3 flex-wrap text-[13px] text-[#1A3A5C]">
                    <span className="min-w-[180px]">{st.storeName}{st.storeNumber ? ` #${st.storeNumber.replace(/^#/, "")}` : ""}</span>
                    <a href={`/display/${st.slug}?preview=brand`} target="_blank" rel="noopener noreferrer" className={link}>New design ↗</a>
                    <a href={`/display/${st.slug}?preview=classic`} target="_blank" rel="noopener noreferrer" className={link}>Current design ↗</a>
                  </div>
                ))}
                <div className="flex items-center gap-3 flex-wrap text-[13px] text-[#1A3A5C]">
                  <span className="min-w-[180px]">All locations (Live Ads)</span>
                  <a href="/display/all?preview=brand" target="_blank" rel="noopener noreferrer" className={link}>New design ↗</a>
                </div>
              </div>
              <p className="text-[11px] text-[#5B7D96] mt-2">
                Speed test on a store&apos;s mini PC: add <code>&amp;fps</code> to a preview link (e.g. <code>/display/…?preview=brand&amp;fps</code>) for a frame-rate meter. Smooth is about 60 fps.
              </p>
            </div>

            {message && <div className={message.ok ? "text-[12px] text-green-800" : "text-[12px] text-red-700"}>{message.text}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
