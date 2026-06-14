"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDashboardSocket } from "@/lib/socket/client";
import { Check, X, RefreshCw, Trash2, MonitorPlay, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved:  "bg-green-100 text-green-800 border-green-200",
  denied:    "bg-red-100 text-red-800 border-red-200",
  expired:   "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  user:        "bg-slate-100 text-slate-600 border-slate-200",
  store_owner: "bg-blue-100 text-blue-800 border-blue-200",
  approver:    "bg-yellow-100 text-yellow-800 border-yellow-200",
  admin:       "bg-red-100 text-red-800 border-red-200",
};

const ROLE_LABEL: Record<string, string> = {
  user: "User",
  store_owner: "Store Owner",
  approver: "Approver",
  admin: "Admin",
};

type Stats = {
  totalAds: number;
  pendingAds: number;
  approvedAds: number;
  deniedAds: number;
  totalUsers: number;
  totalLocations: number;
  totalRevenueCents: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  banned: boolean;
  banReason: string | null;
};

type Ad = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  status: string;
  paymentStatus: string;
  reviewNote: string | null;
  startedAt: string;
  endedAt: string;
  createdAt: string;
  contactPhone: string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  showPhone: boolean;
  showAddress: boolean;
  showWebsite: boolean;
  user: { id: string; name: string; email: string };
  location: { id: string; storeName: string; slug: string };
};

const PAGE_SIZE = 10;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#D8E4EE] bg-[#F7F9FC]">
      <span className="text-[11px] text-[#6B8FA8]">
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-2.5 py-1 rounded border text-[11px] disabled:opacity-35 disabled:cursor-not-allowed border-[#D8E4EE] text-[#6B8FA8] hover:border-[#4A90C4] hover:text-[#1A3A5C] bg-white cursor-pointer"
        >← Prev</button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`d${i}`} className="px-1 text-[11px] text-[#9DB8CC]">…</span>
            : <button key={p} onClick={() => onChange(p as number)}
                className={cn("min-w-[28px] h-7 rounded border text-[11px] font-semibold",
                  page === p
                    ? "bg-[#1A3A5C] border-[#1A3A5C] text-white"
                    : "border-[#D8E4EE] text-[#6B8FA8] hover:border-[#4A90C4] hover:text-[#1A3A5C] bg-white cursor-pointer"
                )}>{p}</button>
        )}
        <button
          onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-2.5 py-1 rounded border text-[11px] disabled:opacity-35 disabled:cursor-not-allowed border-[#D8E4EE] text-[#6B8FA8] hover:border-[#4A90C4] hover:text-[#1A3A5C] bg-white cursor-pointer"
        >Next →</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accentClass, onClick }: { label: string; value: string | number; sub?: string; accentClass?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex-1 basis-40 bg-white rounded-xl border border-[#D8E4EE] px-6 py-5 transition-colors",
        onClick && "cursor-pointer hover:border-[#4A90C4] hover:bg-[#F7FAFD]"
      )}
    >
      <div className="text-[11px] font-semibold text-[#6B8FA8] uppercase tracking-[0.05em] mb-2">{label}</div>
      <div className={cn("text-[28px] font-bold leading-none", accentClass ?? "text-[#1A3A5C]")}>{value}</div>
      {sub && <div className="text-xs text-[#6B8FA8] mt-1">{sub}</div>}
      {onClick && <div className="text-[10px] text-[#9DC4E0] mt-2">Click to view →</div>}
    </div>
  );
}

// ─── Admin Edit Dialog ────────────────────────────────────────────────────────

type EditDraft = {
  title: string;
  description: string;
  status: string;
  paymentStatus: string;
  startedAt: string;
  endedAt: string;
  displayOrder: number;
  contactPhone: string;
  contactAddress: string;
  contactWebsite: string;
  showPhone: boolean;
  showAddress: boolean;
  showWebsite: boolean;
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminEditAdDialog({
  ad,
  onClose,
  onSaved,
}: {
  ad: Ad;
  onClose: () => void;
  onSaved: (updated: Partial<Ad>) => void;
}) {
  const [draft, setDraft] = useState<EditDraft>({
    title:          ad.title,
    description:    ad.description    ?? "",
    status:         ad.status,
    paymentStatus:  ad.paymentStatus,
    startedAt:      toDatetimeLocal(ad.startedAt),
    endedAt:        toDatetimeLocal(ad.endedAt),
    displayOrder:   0,
    contactPhone:   ad.contactPhone   ?? "",
    contactAddress: ad.contactAddress ?? "",
    contactWebsite: ad.contactWebsite ?? "",
    showPhone:      ad.showPhone,
    showAddress:    ad.showAddress,
    showWebsite:    ad.showWebsite,
  });
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadErr,   setUploadErr]   = useState<string | null>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "ads");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Upload failed");
      setNewImageUrl(json.data.publicUrl);
    } catch (e: any) {
      setUploadErr(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const set = (k: keyof EditDraft, v: string | number | boolean) => {
    setDraft(d => ({ ...d, [k]: v }));
    setFieldErrors(e => { const n = { ...e }; delete n[k as string]; return n; });
  };

  const fe = (k: string) => fieldErrors[k]
    ? <p className="text-[11px] text-red-600 mt-1">{fieldErrors[k]}</p>
    : null;

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:          draft.title.trim(),
          description:    draft.description.trim() || null,
          status:         draft.status,
          paymentStatus:  draft.paymentStatus,
          startedAt:      new Date(draft.startedAt).toISOString(),
          endedAt:        new Date(draft.endedAt).toISOString(),
          displayOrder:   Number(draft.displayOrder),
          ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
          contactPhone:   draft.contactPhone.trim()   || null,
          contactAddress: draft.contactAddress.trim() || null,
          contactWebsite: draft.contactWebsite.trim() || null,
          showPhone:      draft.showPhone,
          showAddress:    draft.showAddress,
          showWebsite:    draft.showWebsite,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        if (json.details?.length) {
          const fe: Record<string, string> = {};
          for (const d of json.details) {
            const field = d.path?.[0] as string | undefined;
            if (field) fe[field] = d.message;
          }
          setFieldErrors(fe);
          throw new Error("Please fix the highlighted fields.");
        }
        throw new Error(json.error ?? "Save failed");
      }
      toast.success("Ad updated successfully");
      onSaved({
        title:          draft.title.trim(),
        description:    draft.description.trim() || null,
        status:         draft.status as Ad["status"],
        paymentStatus:  draft.paymentStatus as Ad["paymentStatus"],
        startedAt:      new Date(draft.startedAt).toISOString(),
        endedAt:        new Date(draft.endedAt).toISOString(),
        ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
        contactPhone:   draft.contactPhone.trim()   || null,
        contactAddress: draft.contactAddress.trim() || null,
        contactWebsite: draft.contactWebsite.trim() || null,
        showPhone:      draft.showPhone,
        showAddress:    draft.showAddress,
        showWebsite:    draft.showWebsite,
      });
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "text-[11px] font-semibold text-[#6B8FA8] uppercase tracking-wide mb-1 block";
  const inputCls = "w-full border border-[#D8E4EE] rounded-lg px-3 py-2 text-sm text-[#1A3A5C] bg-[#FAFCFF] outline-none focus:border-[#4A90C4]";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(96vw,520px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1A3A5C] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Pencil size={15} className="text-white/70" />
            <span className="font-serif font-bold text-white text-[16px]">Edit Ad (Admin)</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none bg-transparent border-none cursor-pointer">×</button>
        </div>

        {/* Ad thumbnail + id */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[#EDF2F7] bg-[#F7FAFC] shrink-0">
          <label className="relative group cursor-pointer shrink-0" title="Click to replace image">
            <img src={newImageUrl ?? ad.imageUrl} alt="" className="w-12 h-9 object-cover rounded-md" />
            <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <span className="text-white text-[9px] font-bold">…</span>
                : <span className="text-white text-[9px] font-bold leading-tight text-center">Replace</span>
              }
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageChange} disabled={uploading} />
          </label>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#1A3A5C] truncate max-w-[280px]">{ad.title}</div>
            <div className="text-[10px] text-[#9DB8CC] font-mono">ID: {ad.id}</div>
            {newImageUrl && <div className="text-[10px] text-green-600 font-semibold mt-0.5">✓ New image ready to save</div>}
            {uploadErr  && <div className="text-[10px] text-red-600 mt-0.5">{uploadErr}</div>}
          </div>
          <span className="ml-auto text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 font-semibold shrink-0">Testing only — no emails sent</span>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className={labelCls}>Title</label>
            <input className={`${inputCls} ${fieldErrors.title ? "border-red-400" : ""}`} value={draft.title} onChange={e => set("title", e.target.value)} />
            {fe("title")}
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description <span className="normal-case text-[#9DB8CC] font-normal">(optional)</span></label>
            <textarea className={`${inputCls} resize-none ${fieldErrors.description ? "border-red-400" : ""}`} rows={2} value={draft.description} onChange={e => set("description", e.target.value)} />
            {fe("description")}
          </div>

          {/* Contact fields */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + " mb-0"}>Phone <span className="normal-case text-[#9DB8CC] font-normal">(optional)</span></label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#6B8FA8]">
                <input type="checkbox" checked={draft.showPhone} onChange={e => set("showPhone", e.target.checked)} className="accent-[#4A90C4]" />
                Show on display
              </label>
            </div>
            <input className={`${inputCls} ${fieldErrors.contactPhone ? "border-red-400" : ""}`} placeholder="e.g. (555) 123-4567" value={draft.contactPhone} onChange={e => {
              set("contactPhone", e.target.value);
              if (e.target.value.trim()) setDraft(d => ({ ...d, showPhone: true }));
            }} />
            {fe("contactPhone")}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + " mb-0"}>Address <span className="normal-case text-[#9DB8CC] font-normal">(optional)</span></label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#6B8FA8]">
                <input type="checkbox" checked={draft.showAddress} onChange={e => set("showAddress", e.target.checked)} className="accent-[#4A90C4]" />
                Show on display
              </label>
            </div>
            <input className={`${inputCls} ${fieldErrors.contactAddress ? "border-red-400" : ""}`} placeholder="e.g. 123 Main St, City, State" value={draft.contactAddress} onChange={e => {
              set("contactAddress", e.target.value);
              if (e.target.value.trim()) setDraft(d => ({ ...d, showAddress: true }));
            }} />
            {fe("contactAddress")}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + " mb-0"}>Website URL <span className="normal-case text-[#9DB8CC] font-normal">(optional)</span></label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#6B8FA8]">
                <input type="checkbox" checked={draft.showWebsite} onChange={e => set("showWebsite", e.target.checked)} className="accent-[#4A90C4]" />
                Show on display
              </label>
            </div>
            <input className={`${inputCls} ${fieldErrors.contactWebsite ? "border-red-400" : ""}`} placeholder="https://example.com" value={draft.contactWebsite} onChange={e => {
              set("contactWebsite", e.target.value);
              if (e.target.value.trim()) setDraft(d => ({ ...d, showWebsite: true }));
            }} />
            {fe("contactWebsite")}
          </div>

          {/* Status + Payment status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <select className={`${selectCls} ${fieldErrors.status ? "border-red-400" : ""}`} value={draft.status} onChange={e => set("status", e.target.value)}>
                {["pending","approved","denied","expired","cancelled"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {fe("status")}
            </div>
            <div>
              <label className={labelCls}>Payment Status</label>
              <select className={`${selectCls} ${fieldErrors.paymentStatus ? "border-red-400" : ""}`} value={draft.paymentStatus} onChange={e => set("paymentStatus", e.target.value)}>
                {["unpaid","paid","refunded","refund_pending","failed"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {fe("paymentStatus")}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start date</label>
              <input type="datetime-local" className={`${inputCls} ${fieldErrors.startedAt ? "border-red-400" : ""}`} value={draft.startedAt} onChange={e => set("startedAt", e.target.value)} />
              {fe("startedAt")}
            </div>
            <div>
              <label className={labelCls}>End date</label>
              <input type="datetime-local" className={`${inputCls} ${fieldErrors.endedAt ? "border-red-400" : ""}`} value={draft.endedAt} onChange={e => set("endedAt", e.target.value)} />
              {fe("endedAt")}
            </div>
          </div>

          {/* Display order */}
          <div className="w-32">
            <label className={labelCls}>Display order</label>
            <input type="number" min={0} className={`${inputCls} ${fieldErrors.displayOrder ? "border-red-400" : ""}`} value={draft.displayOrder} onChange={e => set("displayOrder", Number(e.target.value))} />
            {fe("displayOrder")}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EDF2F7] flex justify-end gap-3 shrink-0 bg-[#FAFCFF]">
          <Button variant="outline" size="sm" onClick={onClose} className="h-auto px-4 py-2 text-sm font-semibold border-[#D8E4EE] text-[#6B8FA8]">
            Cancel
          </Button>
          <Button size="sm" disabled={saving} onClick={save} className="h-auto px-5 py-2 text-sm font-semibold bg-[#1A3A5C] hover:bg-[#14304d] text-white">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPanelClient({
  initialStats,
  initialUsers,
  initialAds,
  currentUserId,
}: {
  initialStats: Stats;
  initialUsers: User[];
  initialAds: Ad[];
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "ads">("overview");
  const [stats] = useState<Stats>(initialStats);

  // Users state
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [userToast, setUserToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [banning, setBanning] = useState<string | null>(null);
  const [banReasonInput, setBanReasonInput] = useState<Record<string, string>>({});
  const [confirmBan, setConfirmBan] = useState<string | null>(null);

  // Pagination
  const [userPage, setUserPage] = useState(1);
  const [adPage,   setAdPage]   = useState(1);

  // Ads state
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [overriding, setOverriding] = useState<string | null>(null);
  const [adToast, setAdToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [overrideNote, setOverrideNote] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  // Force-refresh display screens
  const [refreshingSlug, setRefreshingSlug] = useState<string | null>(null);
  const uniqueLocations = [...new Map(ads.map(a => [a.location.slug, a.location])).values()];

  function showUserToast(msg: string, ok: boolean) {
    setUserToast({ msg, ok });
    setTimeout(() => setUserToast(null), 3500);
  }

  function showAdToast(msg: string, ok: boolean) {
    setAdToast({ msg, ok });
    setTimeout(() => setAdToast(null), 3500);
  }

  async function changeRole(userId: string, role: string) {
    setRoleChanging(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      showUserToast(`Role updated to ${ROLE_LABEL[role]}`, true);
    } catch (e: any) {
      showUserToast(e.message || "Failed to update role", false);
    } finally {
      setRoleChanging(null);
    }
  }

  async function banUser(userId: string, banned: boolean) {
    setBanning(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned, banReason: banReasonInput[userId] ?? "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, banned, banReason: banned ? (banReasonInput[userId] ?? null) : null }
        : u
      ));
      showUserToast(banned ? "User banned" : "User unbanned", true);
    } catch (e: any) {
      showUserToast(e.message || "Failed to update ban status", false);
    } finally {
      setBanning(null);
      setConfirmBan(null);
      setBanReasonInput(r => { const n = { ...r }; delete n[userId]; return n; });
    }
  }

  async function overrideAdStatus(adId: string, status: string) {
    if ((status === "denied" || status === "cancelled") && !(overrideNote[adId] ?? "").trim()) {
      showAdToast(`A review note is required when ${status === "denied" ? "denying" : "cancelling"} an ad.`, false);
      return;
    }
    setOverriding(adId);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, status, reviewNote: overrideNote[adId] ?? "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAds(prev => prev.map(a => a.id === adId ? { ...a, status, reviewNote: overrideNote[adId] ?? a.reviewNote } : a));
      showAdToast("Ad status overridden", true);
    } catch (e: any) {
      showAdToast(e.message || "Override failed", false);
    } finally {
      setOverriding(null);
    }
  }

  async function endAd(adId: string) {
    try {
      const res = await fetch(`/api/ads/${adId}/end`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAds(prev => prev.map(a => a.id === adId ? { ...a, status: "cancelled" } : a));
      showAdToast("Ad ended", true);
    } catch (e: any) {
      showAdToast(e.message || "Failed to end ad", false);
    }
  }

  async function renewAd(adId: string) {
    try {
      const res = await fetch(`/api/ads/${adId}/renew`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAds(prev => prev.map(a => a.id === adId
        ? { ...a, status: "pending", paymentStatus: "unpaid", reviewNote: null }
        : a
      ));
      showAdToast("Ad renewed — owner must complete payment to go live", true);
    } catch (e: any) {
      showAdToast(e.message || "Failed to renew ad", false);
    }
  }

  async function deleteAd(adId: string) {
    setDeleting(adId);
    try {
      const res = await fetch(`/api/ads/${adId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAds(prev => prev.filter(a => a.id !== adId));
      showAdToast("Ad deleted", true);
    } catch (e: any) {
      showAdToast(e.message || "Failed to delete ad", false);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  const fetchAllAds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ads");
      const json = await res.json();
      if (json.success) setAds(json.data);
    } catch { }
  }, []);

  // Auto-poll every 30s when the Ads tab is open
  useEffect(() => {
    if (activeTab !== "ads") return;
    const id = setInterval(fetchAllAds, 30_000);
    return () => clearInterval(id);
  }, [activeTab, fetchAllAds]);

  // Socket: when a new ad arrives (unknown adId) refresh the full list
  useDashboardSocket(useCallback(({ adId }: { adId: string; status: string; locationSlug: string }) => {
    setAds(prev => {
      if (prev.some(a => a.id === adId)) return prev; // existing ad — status change handled elsewhere
      fetchAllAds(); // new submission — reload list
      return prev;
    });
  }, [fetchAllAds]));

  async function forceRefresh(slug: string) {
    setRefreshingSlug(slug);
    try {
      const res = await fetch("/api/admin/display/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showAdToast(`Refresh sent to display:${slug}`, true);
    } catch (e: any) {
      showAdToast(e.message || "Failed to send refresh", false);
    } finally {
      setRefreshingSlug(null);
    }
  }

  const filteredAds = ads.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const q = userSearch.trim().toLowerCase();
    const matchUser = !q || a.user.name.toLowerCase().includes(q) || a.user.email.toLowerCase().includes(q);
    return matchStatus && matchUser;
  });

  // Reset pages when filters/data change
  useEffect(() => { setAdPage(1);   }, [statusFilter, userSearch]);
  useEffect(() => { setUserPage(1); }, [users.length]);

  const pagedUsers = users.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const pagedAds   = filteredAds.slice((adPage - 1) * PAGE_SIZE, adPage * PAGE_SIZE);

  return (
    <div className="w-full">
      {/* Toasts */}
      {userToast && (
        <Alert
          className={cn(
            "fixed top-6 right-6 z-[9999] w-auto max-w-xs shadow-lg border-0 text-white",
            userToast.ok ? "bg-green-800" : "bg-red-800"
          )}
        >
          <AlertDescription className="text-white font-medium">{userToast.msg}</AlertDescription>
        </Alert>
      )}
      {adToast && (
        <Alert
          className={cn(
            "fixed top-[68px] right-6 z-[9999] w-auto max-w-xs shadow-lg border-0 text-white",
            adToast.ok ? "bg-green-800" : "bg-red-800"
          )}
        >
          <AlertDescription className="text-white font-medium">{adToast.msg}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-7">
        <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Admin Panel</h1>
        <p className="text-[#6B8FA8] text-sm">Platform-wide oversight — users, ads, and revenue.</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "users" | "ads")}>
        <TabsList className="mb-7 bg-[#F0F5FA] rounded-[10px] p-1 h-auto gap-1.5">
          <TabsTrigger
            value="overview"
            className="rounded-lg text-[13px] px-[18px] py-2 data-[state=active]:bg-[#1A3A5C] data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:text-[#6B8FA8] data-[state=inactive]:bg-transparent"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="rounded-lg text-[13px] px-[18px] py-2 data-[state=active]:bg-[#1A3A5C] data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:text-[#6B8FA8] data-[state=inactive]:bg-transparent"
          >
            Users ({stats.totalUsers})
          </TabsTrigger>
          <TabsTrigger
            value="ads"
            className="rounded-lg text-[13px] px-[18px] py-2 data-[state=active]:bg-[#1A3A5C] data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:text-[#6B8FA8] data-[state=inactive]:bg-transparent"
          >
            All Ads ({stats.totalAds})
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-0">
          {/* Stat cards */}
          <div className="flex flex-wrap gap-4 mb-8">
            <StatCard label="Total Revenue" value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} sub="from paid ads" accentClass="text-green-800" />
            <StatCard label="Total Ads" value={stats.totalAds} onClick={() => { setStatusFilter("all"); setUserSearch(""); setActiveTab("ads"); }} />
            <StatCard label="Pending Review" value={stats.pendingAds} accentClass={stats.pendingAds > 0 ? "text-yellow-800" : "text-[#1A3A5C]"} onClick={() => { setStatusFilter("pending"); setUserSearch(""); setActiveTab("ads"); }} />
            <StatCard label="Approved" value={stats.approvedAds} accentClass="text-green-800" onClick={() => { setStatusFilter("approved"); setUserSearch(""); setActiveTab("ads"); }} />
            <StatCard label="Denied" value={stats.deniedAds} accentClass="text-red-800" onClick={() => { setStatusFilter("denied"); setUserSearch(""); setActiveTab("ads"); }} />
            <StatCard label="Users" value={stats.totalUsers} onClick={() => setActiveTab("users")} />
            <StatCard label="Locations" value={stats.totalLocations} onClick={() => { window.location.href = "/dashboard/store-owner"; }} />
          </div>

          {/* Quick links */}
          <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
              <CardTitle className="font-serif text-[17px] text-[#1A3A5C]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 p-6">
              <Button
                variant="outline"
                className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 text-[13px] font-semibold h-auto px-5 py-2.5"
                onClick={() => setActiveTab("users")}
              >
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="bg-green-50 text-green-800 border-green-200 hover:bg-green-100 text-[13px] font-semibold h-auto px-5 py-2.5"
                onClick={() => setActiveTab("ads")}
              >
                Review All Ads
              </Button>
              <Button variant="outline" className="bg-[#F0F5FA] text-[#1A3A5C] border-[#D8E4EE] hover:bg-[#E8EFF6] text-[13px] font-semibold h-auto px-5 py-2.5" asChild>
                <Link href="/dashboard/store-owner">All Store Locations</Link>
              </Button>
              <Button variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 text-[13px] font-semibold h-auto px-5 py-2.5" asChild>
                <Link href="/dashboard/approver">Approver Queue</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Display screen force-refresh */}
          {uniqueLocations.length > 0 && (
            <Card className="rounded-xl border-[#D8E4EE] overflow-hidden mt-5">
              <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
                <CardTitle className="font-serif text-[17px] text-[#1A3A5C] flex items-center gap-2">
                  <MonitorPlay size={17} className="text-[#4A90C4]" />
                  Display Screens
                </CardTitle>
                <p className="text-xs text-[#6B8FA8] mt-1">Force-push a refresh to all display screens at a location.</p>
              </CardHeader>
              <CardContent className="p-5 flex flex-wrap gap-3">
                {uniqueLocations.map(loc => (
                  <div key={loc.slug} className="flex items-center gap-2 bg-[#F7F9FC] border border-[#D8E4EE] rounded-lg px-4 py-2.5">
                    <span className="text-[13px] font-semibold text-[#1A3A5C]">{loc.storeName}</span>
                    <span className="text-[11px] text-[#6B8FA8]">{loc.slug}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={refreshingSlug === loc.slug}
                      onClick={() => forceRefresh(loc.slug)}
                      className="ml-2 h-auto px-3 py-1 text-[11px] font-semibold border-[#4A90C4] text-[#4A90C4] bg-blue-50 hover:bg-blue-100"
                    >
                      <RefreshCw size={11} className={cn("mr-1", refreshingSlug === loc.slug && "animate-spin")} />
                      {refreshingSlug === loc.slug ? "Sending…" : "Force Refresh"}
                    </Button>
                    <Link
                      href={`/display/${loc.slug}`}
                      target="_blank"
                      className="text-[11px] text-[#4A90C4] no-underline hover:underline"
                    >
                      Preview ↗
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="mt-0">
          <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
              <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">All Users</CardTitle>
              <p className="text-xs text-[#6B8FA8] mt-1">{users.length} registered accounts</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#D8E4EE]">
                {pagedUsers.map(u => {
                  const badgeClass = ROLE_BADGE_CLASS[u.role] ?? ROLE_BADGE_CLASS.user;
                  const isSelf = u.id === currentUserId;
                  const adCount = ads.filter(a => a.user.id === u.id).length;
                  return (
                    <div key={u.id} className="px-5 py-4 flex flex-col gap-3">
                      {/* Top row: identity + role */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-sm text-[#1A3A5C]">{u.name}</span>
                            {isSelf && <span className="text-[10px] text-[#6B8FA8]">(you)</span>}
                            {u.twoFactorEnabled && <span title="2FA enabled" className="text-[10px] text-green-700 font-semibold">2FA</span>}
                            {u.banned && <span className="text-[10px] font-semibold text-white bg-red-500 rounded px-1.5 py-0.5">Banned</span>}
                          </div>
                          <div className="text-xs text-[#6B8FA8] truncate">{u.email}</div>
                          <div className="text-[11px] text-[#9DB8CC] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                            {u.lastLoginAt && <span>Login {new Date(u.lastLoginAt).toLocaleString()}</span>}
                            {u.lastLogoutAt && <span>Logout {new Date(u.lastLogoutAt).toLocaleString()}</span>}
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0", badgeClass)}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </div>

                      {/* Bottom row: actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {adCount > 0 && (
                          <button
                            onClick={() => { setUserSearch(u.name); setStatusFilter("all"); setActiveTab("ads"); }}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold hover:bg-blue-200 cursor-pointer border-0"
                          >
                            {adCount} ad{adCount !== 1 ? "s" : ""}
                          </button>
                        )}
                        {!isSelf && (
                          <Select value={u.role} disabled={roleChanging === u.id} onValueChange={v => changeRole(u.id, v)}>
                            <SelectTrigger className={cn("h-7 w-28 text-xs text-[#1A3A5C] border-[#D8E4EE] bg-[#F7F9FC]", roleChanging === u.id && "opacity-60")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="store_owner">Store Owner</SelectItem>
                              <SelectItem value="approver">Approver</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {!isSelf && (u.banned ? (
                          <div className="flex flex-col gap-1">
                            {u.banReason && <span className="text-[11px] text-red-600 italic">"{u.banReason}"</span>}
                            <Button variant="outline" size="sm" disabled={banning === u.id} onClick={() => banUser(u.id, false)}
                              className="h-7 px-3 text-[11px] font-semibold border-green-300 text-green-700 bg-green-50 hover:bg-green-100">
                              {banning === u.id ? "…" : "Unban"}
                            </Button>
                          </div>
                        ) : confirmBan === u.id ? (
                          <div className="flex flex-col gap-1.5">
                            <Input placeholder="Reason (optional)" value={banReasonInput[u.id] ?? ""}
                              onChange={e => setBanReasonInput(r => ({ ...r, [u.id]: e.target.value }))}
                              className="h-7 text-xs border-[#D8E4EE] bg-[#F7F9FC] w-40" />
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" disabled={banning === u.id} onClick={() => banUser(u.id, true)}
                                className="h-7 px-2.5 text-[11px] font-semibold border-red-300 text-red-700 bg-red-50 hover:bg-red-100">
                                {banning === u.id ? "…" : "Confirm"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setConfirmBan(null)}
                                className="h-7 px-2.5 text-[11px] font-semibold border-[#D8E4EE] text-[#6B8FA8] bg-white">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setConfirmBan(u.id)}
                            className="h-7 px-3 text-[11px] font-semibold border-red-200 text-red-600 bg-red-50 hover:bg-red-100">
                            Ban
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {users.length === 0 && (
                  <div className="py-8 text-center text-[#6B8FA8] text-sm">No users found.</div>
                )}
              </div>
              <Paginator page={userPage} total={users.length} onChange={setUserPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADS TAB */}
        <TabsContent value="ads" className="mt-0">
          {/* Filter bar */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            {["all", "pending", "approved", "denied", "expired", "cancelled"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full border text-xs transition-colors",
                  statusFilter === s
                    ? "bg-[#1A3A5C] border-[#1A3A5C] text-white font-semibold"
                    : "bg-white border-[#D8E4EE] text-[#6B8FA8] font-normal hover:border-[#1A3A5C] cursor-pointer"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== "all" && (
                  <span className="ml-1 opacity-75">
                    ({ads.filter(a => a.status === s).length})
                  </span>
                )}
              </button>
            ))}
            <div className="relative">
              <Input
                placeholder="Filter by user…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="h-[30px] w-40 text-xs border-[#D8E4EE] bg-white pl-3 pr-7"
              />
              {userSearch && (
                <button
                  onClick={() => setUserSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B8FA8] hover:text-[#1A3A5C] text-xs leading-none"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={fetchAllAds}
              className="ml-auto px-3.5 py-1.5 rounded-full border text-xs bg-white border-[#D8E4EE] text-[#6B8FA8] hover:border-[#1A3A5C] hover:text-[#1A3A5C] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          </div>

          <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#D8E4EE]">
              <span className="text-[13px] text-[#6B8FA8]">{filteredAds.length} ads</span>
            </div>
            {filteredAds.length === 0 ? (
              <div className="py-8 text-center text-[#6B8FA8] text-sm">No ads match this filter.</div>
            ) : (
              pagedAds.map((ad, idx) => {
                const statusClass = STATUS_BADGE_CLASS[ad.status] ?? STATUS_BADGE_CLASS.pending;
                return (
                  <div key={ad.id} className={cn(idx > 0 && "border-t border-[#D8E4EE]", "px-5 py-3.5")}>
                    <div className="flex gap-3.5 items-start">
                      <img src={ad.imageUrl} alt={ad.title} className="w-[72px] h-[50px] object-cover rounded-md shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-[#1A3A5C]">{ad.title}</span>
                          <Badge variant="outline" className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full", statusClass)}>
                            {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                          </Badge>
                          <span className="text-[11px] text-[#9DC4E0] bg-blue-50 rounded px-1.5 py-0.5">{ad.paymentStatus}</span>
                        </div>
                        <div className="text-xs text-[#6B8FA8] mb-0.5 flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => setUserSearch(ad.user.name)}
                            className="font-semibold text-[#4A90C4] hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs"
                            title={ad.user.email}
                          >
                            {ad.user.name}
                          </button>
                          <span>· {ad.location.storeName} · submitted {new Date(ad.createdAt).toLocaleDateString()}</span>
                        </div>
                        {ad.reviewNote && (
                          <div className="text-xs text-yellow-800 bg-yellow-50 rounded px-2 py-0.5 inline-block">
                            Note: {ad.reviewNote}
                          </div>
                        )}
                        {/* Override controls */}
                        <div className="mt-2.5 flex gap-2 items-start flex-wrap">
                          {/* End / Renew quick actions */}
                          {ad.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => endAd(ad.id)}
                              className="px-2.5 py-1 h-auto rounded-md text-[11px] font-semibold border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                            >
                              End Ad
                            </Button>
                          )}
                          {(ad.status === "expired" || ad.status === "cancelled") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => renewAd(ad.id)}
                              className="px-2.5 py-1 h-auto rounded-md text-[11px] font-semibold border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                            >
                              Renew
                            </Button>
                          )}
                          <Input
                            placeholder="Review note (required to deny/cancel)"
                            value={overrideNote[ad.id] ?? ""}
                            onChange={e => setOverrideNote(n => ({ ...n, [ad.id]: e.target.value }))}
                            className="h-[30px] w-full sm:w-[220px] text-xs text-[#1A3A5C] border-[#D8E4EE] bg-[#F7F9FC]"
                          />
                          {["approved", "denied", "pending", "expired", "cancelled"]
                            .filter(s => s !== ad.status)
                            .map(targetStatus => {
                              const tc = STATUS_BADGE_CLASS[targetStatus] ?? STATUS_BADGE_CLASS.pending;
                              return (
                                <Button
                                  key={targetStatus}
                                  variant="outline"
                                  size="sm"
                                  disabled={overriding === ad.id}
                                  onClick={() => overrideAdStatus(ad.id, targetStatus)}
                                  className={cn(
                                    "px-2.5 py-1 h-auto rounded-md text-[11px] font-semibold border",
                                    overriding === ad.id && "opacity-60 cursor-not-allowed",
                                    tc
                                  )}
                                >
                                  → {targetStatus}
                                </Button>
                              );
                            })}
                          <Link href={`/dashboard/user/ads/${ad.id}`} className="text-xs text-[#4A90C4] no-underline px-2 py-1">
                            Details ↗
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAd(ad)}
                            className="px-2 py-0.5 h-auto rounded text-[11px] font-semibold border-[#4A90C4] text-[#4A90C4] bg-blue-50 hover:bg-blue-100"
                            title="Edit ad (admin)"
                          >
                            <Pencil size={11} className="mr-1" />
                            Edit
                          </Button>
                          {/* Delete — two-step inline confirmation */}
                          {confirmDelete === ad.id ? (
                            <span className="flex items-center gap-1 ml-1">
                              <span className="text-[11px] text-red-700 font-semibold">Delete?</span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deleting === ad.id}
                                onClick={() => deleteAd(ad.id)}
                                className="px-2 py-0.5 h-auto rounded text-[11px] font-semibold border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                              >
                                {deleting === ad.id ? "…" : "Yes"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deleting === ad.id}
                                onClick={() => setConfirmDelete(null)}
                                className="px-2 py-0.5 h-auto rounded text-[11px] font-semibold border-[#D8E4EE] text-[#6B8FA8] bg-white hover:bg-[#F0F5FA]"
                              >
                                No
                              </Button>
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDelete(ad.id)}
                              className="ml-1 px-1.5 py-0.5 h-auto text-[#9DC4E0] hover:text-red-600 hover:bg-red-50"
                              title="Delete ad"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <Paginator page={adPage} total={filteredAds.length} onChange={setAdPage} />
          </Card>
        </TabsContent>
      </Tabs>

      {editingAd && (
        <AdminEditAdDialog
          ad={editingAd}
          onClose={() => setEditingAd(null)}
          onSaved={(updated) => {
            setAds(prev => prev.map(a => a.id === editingAd.id ? { ...a, ...updated } : a));
            setEditingAd(null);
          }}
        />
      )}
    </div>
  );
}
