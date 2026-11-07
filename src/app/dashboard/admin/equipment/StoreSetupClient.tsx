"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Copy, Eye, EyeOff, ExternalLink, Wifi, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SETUP_STEPS } from "@/lib/location-setup";

export type StoreSetupRow = {
  locationId: string;
  storeName: string;
  storeNumber: string | null;
  slug: string;
  wifiName: string | null;
  hasPassword: boolean;
  contactName: string | null;
  contactPhone: string | null;
  networkNotes: string | null;
  checklist: Record<string, string>;
  equipmentCount: number;
  screenCount: number;
  onlineScreens: number;
};

const fieldLabel = "block text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] mb-1";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const displayUrl = (slug: string) => `${APP_URL}/display/${slug}`;

// Big QR to scan with a phone (or the store's mini computer camera); click outside or Esc to close
function QrPopup({ store, onClose }: { store: StoreSetupRow; onClose: () => void }) {
  const url = displayUrl(store.slug);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Live screen QR code for ${store.storeName}`}
    >
      <div className="bg-white rounded-2xl p-6 max-w-[320px] w-full text-center relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} autoFocus className="absolute top-3 right-3 text-[#4A6B82] hover:text-[#1A3A5C]" aria-label="Close">
          <X size={18} />
        </button>
        <div className="font-semibold text-[#1A3A5C] mb-3 pr-6">{store.storeName}</div>
        <QRCodeSVG value={url} size={220} bgColor="#ffffff" fgColor="#1A3A5C" level="M" className="mx-auto" />
        <div className="text-[11px] text-[#4A6B82] font-mono mt-3 break-all">{url}</div>
        <div className="flex gap-2 justify-center mt-3">
          <Button
            type="button" variant="outline" className="h-8 text-xs"
            onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copied"), () => toast.error("Couldn't copy"))}
          >
            <Copy size={13} className="mr-1" /> Copy link
          </Button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="no-underline inline-flex items-center h-8 px-3 rounded-md text-xs font-semibold bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            Open <ExternalLink size={13} className="ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
}

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local date

async function patch(locationId: string, body: object) {
  const res = await fetch(`/api/admin/location-setup/${locationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Save failed");
}

function Checklist({ store }: { store: StoreSetupRow }) {
  const router = useRouter();
  const [list, setList] = useState(store.checklist);
  const [busy, setBusy] = useState(false);

  async function toggle(key: string) {
    const next = { ...list };
    if (next[key]) delete next[key]; else next[key] = today();
    const before = list;
    setList(next);
    setBusy(true);
    try {
      await patch(store.locationId, { checklist: next });
      router.refresh();
    } catch (e: any) {
      setList(before);
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const hint: Record<string, string | null> = {
    paired: store.screenCount ? `${store.screenCount} screen${store.screenCount === 1 ? "" : "s"} assigned, ${store.onlineScreens} online` : "no screen assigned yet",
    delivered: store.equipmentCount ? `${store.equipmentCount} item${store.equipmentCount === 1 ? "" : "s"} listed` : null,
  };

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#1A3A5C] mb-2">Setup checklist</h3>
      <ul className="flex flex-col gap-1.5">
        {SETUP_STEPS.map((s) => (
          <li key={s.key}>
            <label className="flex items-start gap-2 text-sm text-[#1A3A5C] cursor-pointer">
              <input type="checkbox" className="mt-1" checked={!!list[s.key]} disabled={busy} onChange={() => toggle(s.key)} />
              <span>
                {s.label}
                {list[s.key] && <span className="text-[11px] text-green-700 ml-1.5">✓ {list[s.key]}</span>}
                {hint[s.key] && <span className="block text-[11px] text-[#6B7A8C]">{hint[s.key]}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WifiForm({ store }: { store: StoreSetupRow }) {
  const router = useRouter();
  const [wifiName, setWifiName] = useState(store.wifiName ?? "");
  const [contactName, setContactName] = useState(store.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(store.contactPhone ?? "");
  const [notes, setNotes] = useState(store.networkNotes ?? "");
  // Password: shown only after "Show"; typing a new one replaces it
  const [shown, setShown] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(store.hasPassword ? null : "");
  const [saving, setSaving] = useState(false);

  async function show() {
    if (shown !== null) { setShown(null); return; }
    try {
      const res = await fetch(`/api/admin/location-setup/${store.locationId}/password`, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShown(json.data.password);
    } catch (e: any) {
      toast.error(e.message || "Couldn't load the password");
    }
  }

  async function copy() {
    if (shown === null) return;
    try { await navigator.clipboard.writeText(shown); toast.success("Copied"); } catch { toast.error("Couldn't copy"); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await patch(store.locationId, {
        wifiName, contactName, contactPhone, networkNotes: notes,
        // only send the password when it was typed (or cleared)
        ...(newPassword !== null && (newPassword !== "" || store.hasPassword) ? { wifiPassword: newPassword || null } : {}),
      });
      toast.success("Saved");
      setShown(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#1A3A5C] mb-2 flex items-center gap-1.5"><Wifi size={13} /> WiFi &amp; contact</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel}>WiFi name</label>
          <Input value={wifiName} onChange={(e) => setWifiName(e.target.value)} maxLength={100} autoComplete="off" />
        </div>
        <div>
          <label className={fieldLabel}>WiFi password</label>
          {newPassword === null ? (
            <div className="flex items-center gap-1.5">
              <code className="flex-1 min-w-0 h-9 flex items-center px-2.5 rounded-md border border-[#D1DDE8] bg-[#F7F9FC] text-sm text-[#1A3A5C] truncate">
                {shown ?? "••••••••"}
              </code>
              <Button type="button" variant="outline" onClick={show} className="h-9 px-2.5" title={shown === null ? "Show" : "Hide"}>
                {shown === null ? <Eye size={15} /> : <EyeOff size={15} />}
              </Button>
              {shown !== null && (
                <Button type="button" variant="outline" onClick={copy} className="h-9 px-2.5" title="Copy"><Copy size={15} /></Button>
              )}
              <Button type="button" variant="outline" onClick={() => { setShown(null); setNewPassword(""); }} className="h-9 px-2.5 text-xs">Change</Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                maxLength={200}
                autoComplete="off"
                spellCheck={false}
                placeholder={store.hasPassword ? "New password (leave empty to remove)" : "Not saved yet"}
              />
              {store.hasPassword && (
                <Button type="button" variant="outline" onClick={() => setNewPassword(null)} className="h-9 px-2.5 text-xs">Keep old</Button>
              )}
            </div>
          )}
          <p className="text-[11px] text-[#6B7A8C] mt-1">Stored encrypted; only admins can see it.</p>
        </div>
        <div>
          <label className={fieldLabel}>Store contact</label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={100} placeholder="Who can reset the router / let us in" />
        </div>
        <div>
          <label className={fieldLabel}>Contact phone</label>
          <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={40} />
        </div>
        <div className="sm:col-span-2">
          <label className={fieldLabel}>Network notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} placeholder="e.g. Router in the back office; guest network blocks devices" />
        </div>
      </div>
      <Button type="submit" disabled={saving} className="h-9 mt-3 text-[13px] bg-[#1A3A5C] hover:bg-[#15304d] text-white">
        {saving ? "Saving…" : "Save WiFi & contact"}
      </Button>
    </form>
  );
}

function StoreCard({ store }: { store: StoreSetupRow }) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState(false);
  const done = SETUP_STEPS.filter((s) => store.checklist[s.key]).length;
  const complete = done === SETUP_STEPS.length;

  return (
    <div className="bg-white rounded-xl border border-[#D8E4EE] overflow-hidden">
      <div className="flex items-stretch">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F7FAFC] transition-colors"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-[#1A3A5C] truncate">
            {store.storeName}{store.storeNumber ? ` #${store.storeNumber.replace(/^#/, "")}` : ""}
          </div>
          <div className="text-xs text-[#4A6B82] mt-0.5 flex flex-wrap gap-x-3">
            <span>{store.equipmentCount} item{store.equipmentCount === 1 ? "" : "s"}</span>
            <span>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${store.onlineScreens ? "bg-green-500" : "bg-slate-300"}`} />
              {store.screenCount ? `${store.onlineScreens}/${store.screenCount} screen online` : "no screen"}
            </span>
            <span>{store.wifiName ? `WiFi: ${store.wifiName}${store.hasPassword ? "" : " (no password)"}` : "WiFi not saved"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-[#E5EDF4] overflow-hidden">
            <div className={`h-full ${complete ? "bg-green-500" : "bg-[#E8563A]"}`} style={{ width: `${(done / SETUP_STEPS.length) * 100}%` }} />
          </div>
          <span className={`text-xs font-semibold ${complete ? "text-green-700" : "text-[#1A3A5C]"}`}>
            {complete ? "Done" : `${done}/${SETUP_STEPS.length}`}
          </span>
          <ChevronDown size={16} className={`text-[#4A6B82] transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {/* Live screen: open it in a new tab, or click the QR for a big one to scan */}
      <div className="flex items-center gap-2 pl-2 pr-3 border-l border-[#E5EDF4]">
        <button
          type="button"
          onClick={() => setQr(true)}
          className="rounded-md border border-[#D8E4EE] p-1 bg-white hover:border-[#4A90C4] transition-colors"
          title="Show QR code"
          aria-label={`Show QR code for ${store.storeName}'s live screen`}
        >
          <QRCodeSVG value={displayUrl(store.slug)} size={36} bgColor="#ffffff" fgColor="#1A3A5C" level="L" />
        </button>
        <a
          href={displayUrl(store.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline flex items-center gap-1 text-xs font-semibold text-[#4A90C4] hover:text-[#1A3A5C] whitespace-nowrap"
          title={displayUrl(store.slug)}
        >
          <span className="hidden sm:inline">Live screen</span> <ExternalLink size={13} />
        </a>
      </div>
      </div>
      {qr && <QrPopup store={store} onClose={() => setQr(false)} />}
      {open && (
        <div className="border-t border-[#E5EDF4] p-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-6">
          <Checklist store={store} />
          <WifiForm store={store} />
        </div>
      )}
    </div>
  );
}

export default function StoreSetupClient({ stores }: { stores: StoreSetupRow[] }) {
  const finished = stores.filter((s) => SETUP_STEPS.every((st) => s.checklist[st.key])).length;
  if (!stores.length) {
    return <div className="bg-white rounded-xl border border-[#D8E4EE] p-10 text-center text-sm text-[#4A6B82]">No active stores yet.</div>;
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#4A6B82]">
        <strong className="text-[#1A3A5C]">{finished} of {stores.length}</strong> stores fully set up. Click a store for its checklist and WiFi details.
      </p>
      {stores.map((s) => <StoreCard key={s.locationId} store={s} />)}
    </div>
  );
}
