"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_REMOTE_URL, EQUIPMENT_STATUSES, EQUIPMENT_TYPES, statusLabel, typeLabel } from "@/lib/equipment";
import { SecretField } from "./SecretField";
import { ExternalLink, MonitorSmartphone } from "lucide-react";
import { FormPhotos, MAX_PHOTOS, PhotoViewer, photoSrc, uploadPhoto } from "./EquipmentPhotos";

export type EquipmentRow = {
  id: string;
  locationId: string | null;
  locationName: string | null;
  type: string;
  status: string;
  label: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  screenDeviceId: string | null;
  screenLabel: string | null;
  screenLastSeenAt: string | null;
  purchasedOn: string | null;
  costCents: number | null;
  notes: string | null;
  remoteAccount: string | null;
  remoteUrl: string | null;
  remoteComputerName: string | null;
  hasRemotePassword: boolean;
  hasRemotePin: boolean;
  photoIds: string[];
  updatedAt: string;
};

type LocationOption = { id: string; storeName: string; storeNumber: string | null };
type ScreenOption = { id: string; label: string | null; locationId: string | null; locationName: string };

const STATUS_STYLE: Record<string, string> = {
  in_stock: "bg-slate-50 text-slate-700 border-slate-200",
  installed: "bg-green-50 text-green-800 border-green-200",
  repair: "bg-amber-50 text-amber-800 border-amber-200",
  retired: "bg-slate-100 text-slate-500 border-slate-200",
};

const selectCls = "h-9 rounded-md border border-[#D1DDE8] bg-[#F7F9FC] px-2.5 text-base sm:text-sm text-[#1A3A5C] w-full";
const fieldLabel = "block text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] mb-1";

const storeName = (l: LocationOption) => `${l.storeName}${l.storeNumber ? ` #${l.storeNumber.replace(/^#/, "")}` : ""}`;

type FormState = {
  type: string; status: string; locationId: string; label: string; brand: string; model: string;
  serialNumber: string; screenDeviceId: string; purchasedOn: string; cost: string; notes: string;
  remoteAccount: string; remoteUrl: string; remoteComputerName: string;
};

const emptyForm: FormState = {
  type: "mini_pc", status: "in_stock", locationId: "", label: "", brand: "", model: "",
  serialNumber: "", screenDeviceId: "", purchasedOn: "", cost: "", notes: "",
  remoteAccount: "", remoteUrl: "", remoteComputerName: "",
};

function toForm(r: EquipmentRow): FormState {
  return {
    type: r.type, status: r.status, locationId: r.locationId ?? "", label: r.label ?? "", brand: r.brand ?? "",
    model: r.model ?? "", serialNumber: r.serialNumber ?? "", screenDeviceId: r.screenDeviceId ?? "",
    purchasedOn: r.purchasedOn ?? "", cost: r.costCents != null ? (r.costCents / 100).toFixed(2) : "", notes: r.notes ?? "",
    remoteAccount: r.remoteAccount ?? "", remoteUrl: r.remoteUrl ?? "", remoteComputerName: r.remoteComputerName ?? "",
  };
}

function EquipmentForm({
  initial, editingId, initialPhotos = [], savedSecrets = { password: false, pin: false }, locations, screens, onDone,
}: {
  initial: FormState; editingId: string | null; initialPhotos?: string[]; savedSecrets?: { password: boolean; pin: boolean };
  locations: LocationOption[]; screens: ScreenOption[]; onDone: () => void;
}) {
  // Secrets to send on save: null = keep the saved one, "" = clear / none, text = new
  const [remotePassword, setRemotePassword] = useState<string | null>(savedSecrets.password ? null : "");
  const [remotePin, setRemotePin] = useState<string | null>(savedSecrets.pin ? null : "");
  const router = useRouter();
  const [f, setF] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  // Photos: when editing they upload right away; for a new item they wait until it's saved
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [pending, setPending] = useState<{ file: File; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  async function addFiles(files: File[]) {
    const room = MAX_PHOTOS - photos.length - pending.length;
    if (files.length > room) toast.error(`Up to ${MAX_PHOTOS} photos per item; added the first ${Math.max(room, 0)}.`);
    const take = files.slice(0, Math.max(room, 0));
    if (!editingId) {
      setPending((p) => [...p, ...take.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
      return;
    }
    setUploading(true);
    let added = 0;
    for (const file of take) {
      try {
        const id = await uploadPhoto(editingId, file);
        setPhotos((p) => [...p, id]);
        added++;
      } catch (e: any) {
        toast.error(e.message);
      }
    }
    setUploading(false);
    if (added) { toast.success(added === 1 ? "Photo added" : `${added} photos added`); router.refresh(); }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Delete this photo?")) return;
    try {
      const res = await fetch(`/api/admin/equipment/photos/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPhotos((p) => p.filter((x) => x !== id));
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  }

  function removePending(index: number) {
    setPending((p) => {
      URL.revokeObjectURL(p[index].url);
      return p.filter((_, i) => i !== index);
    });
  }
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setF((prev) => {
      const next = { ...prev, [k]: value };
      // Picking a store marks the item installed; clearing it puts it back in stock
      if (k === "locationId") {
        if (value && prev.status === "in_stock") next.status = "installed";
        if (!value && prev.status === "installed") next.status = "in_stock";
      }
      return next;
    });
  };

  // Screens at the chosen store first (any assigned screen can still be picked)
  const screenChoices = useMemo(
    () => [...screens].sort((a, b) => Number(b.locationId === f.locationId) - Number(a.locationId === f.locationId)),
    [screens, f.locationId],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cost = f.cost.trim() ? Math.round(Number(f.cost.replace(/[$,]/g, "")) * 100) : null;
    if (cost != null && (!Number.isFinite(cost) || cost < 0)) { toast.error("Cost should be a number, like 189.99"); return; }
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/admin/equipment/${editingId}` : "/api/admin/equipment", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: f.type, status: f.status, locationId: f.locationId || null, label: f.label, brand: f.brand,
          model: f.model, serialNumber: f.serialNumber, screenDeviceId: f.type === "mini_pc" ? f.screenDeviceId || null : null,
          purchasedOn: f.purchasedOn || null, costCents: cost, notes: f.notes,
          ...(f.type === "mini_pc"
            ? {
                remoteAccount: f.remoteAccount, remoteUrl: f.remoteUrl, remoteComputerName: f.remoteComputerName,
                // only send a secret when it was typed or cleared
                ...(remotePassword !== null && (remotePassword !== "" || savedSecrets.password) ? { remotePassword: remotePassword || null } : {}),
                ...(remotePin !== null && (remotePin !== "" || savedSecrets.pin) ? { remotePin: remotePin || null } : {}),
              }
            : { remoteAccount: null, remoteUrl: null, remoteComputerName: null, remotePassword: null, remotePin: null }),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (!editingId && pending.length) {
        let failed = 0;
        for (const p of pending) {
          try { await uploadPhoto(json.data.id, p.file); } catch { failed++; }
          URL.revokeObjectURL(p.url);
        }
        if (failed) toast.error(`${failed} photo${failed === 1 ? "" : "s"} didn't upload; open Edit to try again.`);
      }
      toast.success(editingId ? "Saved" : "Added");
      onDone();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="bg-white rounded-xl border-2 border-[#4A90C4]/50 p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={fieldLabel}>Type</label>
          <select value={f.type} onChange={set("type")} className={selectCls} autoFocus>
            {EQUIPMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>Store</label>
          <select value={f.locationId} onChange={set("locationId")} className={selectCls}>
            <option value="">— In stock (no store) —</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{storeName(l)}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>Status</label>
          <select value={f.status} onChange={set("status")} className={selectCls}>
            {EQUIPMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className={fieldLabel}>Label</label>
          <Input value={f.label} onChange={set("label")} maxLength={120} placeholder="e.g. TV behind the register, 55-inch" />
        </div>
        <div>
          <label className={fieldLabel}>Brand</label>
          <Input value={f.brand} onChange={set("brand")} maxLength={80} placeholder="e.g. Beelink" />
        </div>
        <div>
          <label className={fieldLabel}>Model</label>
          <Input value={f.model} onChange={set("model")} maxLength={80} placeholder="e.g. Mini S12" />
        </div>
        <div>
          <label className={fieldLabel}>Serial number</label>
          <Input value={f.serialNumber} onChange={set("serialNumber")} maxLength={120} />
        </div>
        {f.type === "mini_pc" && (
          <div className="sm:col-span-3">
            <label className={fieldLabel}>Screen it runs</label>
            <select value={f.screenDeviceId} onChange={set("screenDeviceId")} className={selectCls}>
              <option value="">— Not linked —</option>
              {screenChoices.map((s) => (
                <option key={s.id} value={s.id}>{s.locationName}{s.label ? ` · ${s.label}` : ""} ({s.id.slice(0, 8)})</option>
              ))}
            </select>
            <p className="text-[11px] text-[#4A6B82] mt-1">Only screens assigned to a store on the Screens page are listed.</p>
          </div>
        )}
        {f.type === "mini_pc" && (
          <fieldset className="sm:col-span-3 rounded-lg border border-[#D8E4EE] bg-[#F7FAFC] p-3">
            <legend className="px-1 text-xs font-bold text-[#1A3A5C] flex items-center gap-1.5">
              <MonitorSmartphone size={13} /> Remote access (Chrome Remote Desktop)
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={fieldLabel}>Google account</label>
                <Input type="email" value={f.remoteAccount} onChange={set("remoteAccount")} maxLength={200} autoComplete="off" placeholder="e.g. cb.screens@gmail.com" />
              </div>
              <div>
                <label className={fieldLabel}>Google password</label>
                <SecretField
                  saved={savedSecrets.password}
                  revealUrl={editingId ? `/api/admin/equipment/${editingId}/secret?field=password` : null}
                  value={remotePassword}
                  onChange={setRemotePassword}
                />
              </div>
              <div>
                <label className={fieldLabel}>Remote computer name</label>
                <Input value={f.remoteComputerName} onChange={set("remoteComputerName")} maxLength={100} autoComplete="off" placeholder="e.g. CB-FASTEDDIES-01" />
              </div>
              <div>
                <label className={fieldLabel}>PIN</label>
                <SecretField
                  saved={savedSecrets.pin}
                  revealUrl={editingId ? `/api/admin/equipment/${editingId}/secret?field=pin` : null}
                  value={remotePin}
                  onChange={setRemotePin}
                  inputMode="numeric"
                  placeholder="6+ digits"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={fieldLabel}>URL</label>
                <Input type="url" value={f.remoteUrl} onChange={set("remoteUrl")} maxLength={500} autoComplete="off" placeholder={DEFAULT_REMOTE_URL} />
                {!f.remoteUrl && (
                  <button type="button" onClick={() => setF((p) => ({ ...p, remoteUrl: DEFAULT_REMOTE_URL }))} className="text-[11px] text-[#4A90C4] hover:underline mt-1">
                    Use {DEFAULT_REMOTE_URL}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#6B7A8C] mt-2">Password and PIN are stored encrypted; only admins can see them.</p>
          </fieldset>
        )}
        <div>
          <label className={fieldLabel}>Purchased on</label>
          <Input type="date" value={f.purchasedOn} onChange={set("purchasedOn")} />
        </div>
        <div>
          <label className={fieldLabel}>Cost ($)</label>
          <Input inputMode="decimal" value={f.cost} onChange={set("cost")} placeholder="e.g. 189.99" />
        </div>
        <div className="sm:col-span-3">
          <label className={fieldLabel}>Photos</label>
          <FormPhotos
            saved={photos}
            pending={pending}
            onDeleteSaved={deletePhoto}
            onRemovePending={removePending}
            onFiles={addFiles}
            busy={uploading}
          />
        </div>
        <div className="sm:col-span-3">
          <label className={fieldLabel}>Notes</label>
          <Textarea value={f.notes} onChange={set("notes")} maxLength={2000} rows={2} placeholder="Anything useful: where it is, warranty, quirks" />
        </div>
      </div>
      <p className="text-[11px] text-[#9A6B12] mt-3">Don&apos;t put WiFi or router passwords here; they&apos;ll get their own protected place.</p>
      <div className="flex gap-2 mt-3">
        <Button type="submit" disabled={saving || uploading} className="h-9 text-[13px] bg-[#1A3A5C] hover:bg-[#15304d] text-white">
          {saving ? (pending.length ? "Saving + uploading…" : "Saving…") : editingId ? "Save" : "Add item"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} className="h-9 text-[13px]">Cancel</Button>
      </div>
    </form>
  );
}

function ItemRow({ item, nowIso, onEdit }: { item: EquipmentRow; nowIso: string; onEdit: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const online = item.screenLastSeenAt ? Date.parse(nowIso) - Date.parse(item.screenLastSeenAt) < 3 * 60_000 : null;
  const details = [item.brand, item.model].filter(Boolean).join(" ");

  async function remove() {
    if (!confirm("Delete this item? Use the \"Retired\" status instead if it just stopped being used.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/equipment/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Deleted");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className={`flex items-start justify-between gap-3 px-4 py-3 ${item.status === "retired" ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[#1A3A5C]">{typeLabel(item.type)}</span>
          <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${STATUS_STYLE[item.status] ?? STATUS_STYLE.in_stock}`}>
            {statusLabel(item.status)}
          </span>
          {online !== null && (
            <span className="flex items-center gap-1 text-[11px] text-[#4A6B82]">
              <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-slate-300"}`} />
              Screen {online ? "online" : "offline"}
            </span>
          )}
        </div>
        <div className="text-xs text-[#4A6B82] mt-0.5 break-words">
          {[item.label, details, item.serialNumber && `S/N ${item.serialNumber}`].filter(Boolean).join(" · ") || "No details yet"}
        </div>
        {item.notes && <div className="text-xs text-[#6B7A8C] mt-0.5 whitespace-pre-line break-words">{item.notes}</div>}
        {(item.remoteComputerName || item.remoteUrl) && (
          <div className="text-xs text-[#4A6B82] mt-1 flex items-center gap-1.5 flex-wrap">
            <MonitorSmartphone size={13} className="text-[#4A90C4]" />
            <span>Remote: <strong className="text-[#1A3A5C]">{item.remoteComputerName || "unnamed"}</strong></span>
            {item.remoteAccount && <span className="text-[#6B7A8C]">· {item.remoteAccount}</span>}
            {item.remoteUrl && /^https?:\/\//i.test(item.remoteUrl) && (
              <a href={item.remoteUrl} target="_blank" rel="noopener noreferrer" className="no-underline inline-flex items-center gap-0.5 font-semibold text-[#4A90C4] hover:text-[#1A3A5C]">
                Connect <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
        {item.photoIds.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {item.photoIds.slice(0, 4).map((id, n) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewing(n)}
                className="relative w-12 h-12 rounded-md overflow-hidden border border-[#D8E4EE] bg-[#F7F9FC]"
                aria-label={`View photo ${n + 1}`}
              >
                <img src={photoSrc(id, true)} alt="" loading="lazy" className="w-full h-full object-cover" />
                {n === 3 && item.photoIds.length > 4 && (
                  <span className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex items-center justify-center">
                    +{item.photoIds.length - 4}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        {viewing !== null && <PhotoViewer ids={item.photoIds} start={viewing} onClose={() => setViewing(null)} />}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <Button variant="outline" onClick={onEdit} className="h-8 px-3 text-xs">Edit</Button>
        <Button variant="outline" onClick={remove} disabled={deleting} className="h-8 px-3 text-xs text-red-700 hover:text-red-800">
          {deleting ? "…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

export default function EquipmentClient({
  items, locations, screens, nowIso,
}: {
  items: EquipmentRow[]; locations: LocationOption[]; screens: ScreenOption[]; nowIso: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [store, setStore] = useState("all");
  const [type, setType] = useState("all");
  const [showRetired, setShowRetired] = useState(false);
  const [q, setQ] = useState("");

  const filtered = items.filter((i) => {
    if (store === "stock" ? i.locationId : store !== "all" && i.locationId !== store) return false;
    if (type !== "all" && i.type !== type) return false;
    if (!showRetired && i.status === "retired") return false;
    if (q.trim()) {
      const hay = [i.label, i.brand, i.model, i.serialNumber, i.notes, i.locationName, i.remoteComputerName, i.remoteAccount, typeLabel(i.type)].join(" ").toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  // Group by store; in-stock items last
  const groups = new Map<string, { name: string; rows: EquipmentRow[] }>();
  for (const i of filtered) {
    const key = i.locationId ?? "stock";
    if (!groups.has(key)) groups.set(key, { name: i.locationName ?? "In stock (no store)", rows: [] });
    groups.get(key)!.rows.push(i);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => Number(a === "stock") - Number(b === "stock"));

  const active = items.filter((i) => i.status !== "retired");
  const count = (s: string) => active.filter((i) => i.status === s).length;
  const storesWithGear = new Set(active.filter((i) => i.locationId).map((i) => i.locationId)).size;

  return (
    <div className="flex flex-col gap-4">
      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { n: active.length, l: "Items" },
          { n: `${storesWithGear} / ${locations.length}`, l: "Stores with gear" },
          { n: count("in_stock"), l: "In stock" },
          { n: count("repair"), l: "Need repair" },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-[#D8E4EE] px-4 py-3">
            <div className="font-serif font-bold text-xl text-[#1A3A5C]">{s.n}</div>
            <div className="text-xs text-[#4A6B82]">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters + add */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={store} onChange={(e) => setStore(e.target.value)} className={`${selectCls} sm:w-56`}>
          <option value="all">All stores</option>
          <option value="stock">In stock (no store)</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{storeName(l)}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${selectCls} sm:w-48`}>
          <option value="all">All types</option>
          {EQUIPMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search label, model, serial…" className="h-9 sm:w-56" />
        <label className="flex items-center gap-1.5 text-xs text-[#4A6B82] cursor-pointer">
          <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
          Show retired
        </label>
        <Button
          onClick={() => { setEditingId(null); setAdding(true); }}
          className="h-9 text-[13px] bg-[#E8563A] hover:bg-[#D04530] text-white sm:ml-auto"
        >
          + Add equipment
        </Button>
      </div>

      {adding && (
        <EquipmentForm
          initial={{ ...emptyForm, locationId: store !== "all" && store !== "stock" ? store : "", status: store !== "all" && store !== "stock" ? "installed" : "in_stock" }}
          editingId={null}
          locations={locations}
          screens={screens}
          onDone={() => setAdding(false)}
        />
      )}

      {!items.length && !adding && (
        <div className="bg-white rounded-xl border border-[#D8E4EE] p-10 text-center text-sm text-[#4A6B82]">
          No equipment yet. Click <strong>+ Add equipment</strong> to add the first item.
        </div>
      )}
      {!!items.length && !filtered.length && (
        <div className="bg-white rounded-xl border border-[#D8E4EE] p-6 text-center text-sm text-[#4A6B82]">Nothing matches these filters.</div>
      )}

      {ordered.map(([key, g]) => (
        <section key={key} className="bg-white rounded-xl border border-[#D8E4EE] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F7FAFC] border-b border-[#E5EDF4] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A3A5C]">{g.name}</h2>
            <span className="text-xs text-[#4A6B82]">{g.rows.length} item{g.rows.length === 1 ? "" : "s"}</span>
          </div>
          <div className="divide-y divide-[#EEF3F8]">
            {g.rows.map((i) =>
              editingId === i.id ? (
                <div key={i.id} className="p-3">
                  <EquipmentForm initial={toForm(i)} editingId={i.id} initialPhotos={i.photoIds} savedSecrets={{ password: i.hasRemotePassword, pin: i.hasRemotePin }} locations={locations} screens={screens} onDone={() => setEditingId(null)} />
                </div>
              ) : (
                <ItemRow key={i.id} item={i} nowIso={nowIso} onEdit={() => { setAdding(false); setEditingId(i.id); }} />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
