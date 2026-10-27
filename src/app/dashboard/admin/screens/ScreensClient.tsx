"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ScreenRow = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  currentPath: string | null;
  label: string | null;
  locationId: string | null;
  locationName: string | null;
  checkins: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

type LocationOption = { id: string; storeName: string; storeNumber: string | null; slug: string };

/** "Windows · Chrome", "Linux · Chrome", "iPhone · Safari" */
function deviceSummary(ua: string | null) {
  if (!ua) return "Unknown device";
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android"
    : /CrOS/.test(ua) ? "ChromeOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac"
    : /Linux/.test(ua) ? "Linux" : "Other";
  const browser = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${os} · ${browser}`;
}

function ago(fromIso: string, nowIso: string) {
  const mins = Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(fromIso)) / 60_000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function duration(fromIso: string, toIso: string) {
  const mins = Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60_000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} h ${mins % 60} min`;
  return `${Math.floor(hours / 24)} days`;
}

function ScreenCard({ screen, locations, nowIso }: { screen: ScreenRow; locations: LocationOption[]; nowIso: string }) {
  const router = useRouter();
  const [locationId, setLocationId] = useState(screen.locationId ?? "");
  const [label, setLabel] = useState(screen.label ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = locationId !== (screen.locationId ?? "") || label !== (screen.label ?? "");
  const online = Date.parse(nowIso) - Date.parse(screen.lastSeenAt) < 3 * 60_000;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/screens/${encodeURIComponent(screen.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: locationId || null, label: label || null }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const store = locations.find((l) => l.id === locationId);
      toast.success(store ? `Assigned to ${store.storeName}. The screen switches within a minute.` : "Saved");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#D8E4EE] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-slate-300"}`} />
            <span className="font-semibold text-[#1A3A5C] text-sm">{screen.label || deviceSummary(screen.userAgent)}</span>
            {screen.locationName && (
              <span className="text-[11px] font-semibold text-green-800 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                {screen.locationName}
              </span>
            )}
          </div>
          <div className="text-xs text-[#4A6B82] mt-1">
            {screen.label ? `${deviceSummary(screen.userAgent)} · ` : ""}Showing <code className="text-[11px]">{screen.currentPath ?? "—"}</code> · IP {screen.ip ?? "—"}
          </div>
        </div>
        <div className="text-right text-xs text-[#4A6B82]">
          <div><strong className="text-[#1A3A5C]">{online ? "Online" : `Last seen ${ago(screen.lastSeenAt, nowIso)}`}</strong></div>
          <div>On for {duration(screen.firstSeenAt, screen.lastSeenAt)} · {screen.checkins.toLocaleString()} check-ins</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="h-9 rounded-md border border-[#D1DDE8] bg-[#F7F9FC] px-2.5 text-sm text-[#1A3A5C] min-w-[200px]"
        >
          <option value="">Not assigned</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.storeName}{l.storeNumber ? ` #${l.storeNumber.replace(/^#/, "")}` : ""}</option>
          ))}
        </select>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Fast Eddies TV)"
          maxLength={80}
          className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8] w-56"
        />
        <Button onClick={save} disabled={!dirty || saving} className="h-9 text-[13px] bg-[#1A3A5C] hover:bg-[#15304d] text-white">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function ScreensClient({ screens, locations, nowIso }: { screens: ScreenRow[]; locations: LocationOption[]; nowIso: string }) {
  if (!screens.length) {
    return (
      <div className="bg-white rounded-xl border border-[#D8E4EE] p-10 text-center text-sm text-[#4A6B82]">
        No screens have checked in yet. Screens report in about once a minute after the latest version is deployed.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {screens.map((s) => <ScreenCard key={s.id} screen={s} locations={locations} nowIso={nowIso} />)}
    </div>
  );
}
