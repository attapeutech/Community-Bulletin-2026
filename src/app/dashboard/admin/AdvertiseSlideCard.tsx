"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Settings = { enabled: boolean; headline: string; subline: string; everyNAds: number };

// Admin controls for the built-in "Advertise here" slide on display screens
export function AdvertiseSlideCard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/advertise-slide")
      .then(r => r.json())
      .then(json => json.success && setSettings(json.data))
      .catch(() => setMessage({ ok: false, text: "Could not load settings." }));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings/advertise-slide", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      setMessage(json.success
        ? { ok: true, text: "Saved. Display screens update within seconds." }
        : { ok: false, text: json.error ?? "Could not save." });
    } catch {
      setMessage({ ok: false, text: "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings(s => (s ? { ...s, [key]: value } : s));

  return (
    <Card className="rounded-xl border-[#D8E4EE] overflow-hidden mt-5">
      <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-serif text-[17px] text-[#1A3A5C] flex items-center gap-2">
            <Megaphone size={17} className="text-[#E8563A]" />
            &ldquo;Advertise here&rdquo; slide
          </CardTitle>
          {settings && (
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#4A6B82] cursor-pointer">
              {settings.enabled ? "On" : "Off"}
              <Switch checked={settings.enabled} onCheckedChange={v => set("enabled", v)} />
            </label>
          )}
        </div>
        <p className="text-xs text-[#4A6B82] mt-1">
          Shown on every store screen after every few paid ads, and on its own when a store has none. Its QR code opens Post a New Ad with that store selected; the price comes from each store.
        </p>
      </CardHeader>
      <CardContent className="p-5">
        {!settings ? (
          <div className="text-sm text-[#4A6B82]">{message?.text ?? "Loading…"}</div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Headline</label>
              <Input value={settings.headline} maxLength={60} onChange={e => set("headline", e.target.value)} className="h-9 text-sm border-[#D8E4EE]" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Sub-line</label>
              <Input value={settings.subline} maxLength={120} onChange={e => set("subline", e.target.value)} className="h-9 text-sm border-[#D8E4EE]" />
              <p className="text-[11px] text-[#5B7D96] mt-1">Type <code>{"{store}"}</code> to insert each store&apos;s name.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#1A3A5C]">
              Show after every
              <Input
                type="number"
                min={1}
                max={20}
                value={settings.everyNAds}
                onChange={e => set("everyNAds", Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="h-9 w-16 text-sm border-[#D8E4EE]"
              />
              paid ads
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={save} disabled={saving} className="h-9 text-[13px] bg-[#1A3A5C] hover:bg-[#15304d] text-white">
                {saving ? "Saving…" : "Save"}
              </Button>
              {message && <span className={`text-[13px] ${message.ok ? "text-green-800" : "text-red-700"}`}>{message.text}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
