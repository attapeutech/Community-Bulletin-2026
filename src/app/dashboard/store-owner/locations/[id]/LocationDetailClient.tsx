"use client";

import { useState } from "react";
import Link from "next/link";

const ACCENT = "#1A3A5C";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "#fef9c3", color: "#854d0e" },
  approved:  { bg: "#dcfce7", color: "#166534" },
  denied:    { bg: "#fee2e2", color: "#991b1b" },
  expired:   { bg: "#f1f5f9", color: "#475569" },
  cancelled: { bg: "#f1f5f9", color: "#475569" },
};

type Ad = {
  id: string; title: string; imageUrl: string; status: string;
  paymentStatus: string; displayOrder: number;
  startedAt: string; endedAt: string; createdAt: string;
  user: { id: string; name: string; email: string };
};

type Location = {
  id: string; storeName: string; addressLine1: string;
  addressLine2: string | null; displayName: string | null;
  slug: string; currency: string; isActive: boolean;
  city: { name: string }; state: { code: string }; postalCode: { code: string };
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{label}</span>;
}

export default function LocationDetailClient({
  location, initialAds, isAdmin,
}: {
  location: Location;
  initialAds: Ad[];
  isAdmin: boolean;
}) {
  const [adList, setAdList] = useState<Ad[]>(initialAds);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ storeName: location.storeName, displayName: location.displayName ?? "", addressLine1: location.addressLine1, addressLine2: location.addressLine2 ?? "" });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // Move ad up/down in carousel order
  function moveAd(index: number, dir: -1 | 1) {
    const next = [...adList];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    // Assign new displayOrder values
    setAdList(next.map((a, i) => ({ ...a, displayOrder: i })));
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const order = adList.map((a, i) => ({ adId: a.id, displayOrder: i }));
      const res = await fetch(`/api/locations/${location.id}/ads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Carousel order saved!", true);
    } catch (e: any) {
      showToast(e.message || "Failed to save order", false);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Location updated!", true);
      setEditMode(false);
    } catch (e: any) {
      showToast(e.message || "Update failed", false);
    } finally {
      setSaving(false);
    }
  }

  const approvedAds = adList.filter((a) => a.status === "approved");

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: toast.ok ? "#166534" : "#991b1b", color: "#fff", fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, fontSize: 13, color: "#6B8FA8" }}>
        <Link href="/dashboard/store-owner" style={{ color: "#6B8FA8", textDecoration: "none" }}>
          {isAdmin ? "All Locations" : "My Locations"}
        </Link>
        {" › "}
        <span style={{ color: ACCENT }}>{location.storeName}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: ACCENT, margin: "0 0 4px" }}>{location.storeName}</h1>
          <div style={{ fontSize: 13, color: "#6B8FA8" }}>{location.addressLine1} · {location.city.name}, {location.state.code} {location.postalCode.code}</div>
          <div style={{ fontSize: 11, color: "#9DC4E0", marginTop: 4, fontFamily: "monospace" }}>/display/{location.slug}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/display/${location.slug}`} target="_blank" style={{ fontSize: 13, color: "#4A90C4", border: "1px solid #4A90C4", padding: "8px 14px", borderRadius: 8, textDecoration: "none" }}>
            View Display ↗
          </Link>
          <button onClick={() => setEditMode(!editMode)} style={{ fontSize: 13, color: "#fff", background: ACCENT, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 }}>
            {editMode ? "Cancel Edit" : "Edit Location"}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editMode && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 17, color: ACCENT, marginBottom: 16 }}>Edit Location Details</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Store name", field: "storeName" },
              { label: "Display name (on screen)", field: "displayName" },
              { label: "Address line 1", field: "addressLine1" },
              { label: "Address line 2", field: "addressLine2" },
            ].map(({ label, field }) => (
              <div key={field}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {label}
                </label>
                <input
                  value={(editForm as any)[field]}
                  onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                  style={{ width: "100%", height: 40, borderRadius: 8, padding: "0 12px", border: "1px solid #D1DDE8", background: "#F7F9FC", color: ACCENT, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={saveEdit} disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel order */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #D8E4EE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, margin: 0 }}>Carousel Order</h2>
            <p style={{ fontSize: 12, color: "#6B8FA8", margin: "4px 0 0" }}>
              {approvedAds.length} approved ad{approvedAds.length !== 1 ? "s" : ""} · Drag ↑↓ to reorder
            </p>
          </div>
          {approvedAds.length > 1 && (
            <button onClick={saveOrder} disabled={saving} style={{ padding: "8px 18px", borderRadius: 8, background: "#1A3A5C", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save Order"}
            </button>
          )}
        </div>

        {approvedAds.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6B8FA8", fontSize: 14 }}>
            No approved ads at this location yet.
          </div>
        ) : (
          <div>
            {adList.filter(a => a.status === "approved").map((ad, idx, arr) => (
              <div key={ad.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderBottom: idx < arr.length - 1 ? "1px solid #D8E4EE" : "none" }}>
                {/* Order arrows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveAd(adList.indexOf(ad), -1)} disabled={idx === 0} style={{ background: "none", border: "1px solid #D8E4EE", borderRadius: 4, width: 24, height: 24, cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: 12, color: idx === 0 ? "#D8E4EE" : ACCENT }}>▲</button>
                  <button onClick={() => moveAd(adList.indexOf(ad), 1)} disabled={idx === arr.length - 1} style={{ background: "none", border: "1px solid #D8E4EE", borderRadius: 4, width: 24, height: 24, cursor: idx === arr.length - 1 ? "not-allowed" : "pointer", fontSize: 12, color: idx === arr.length - 1 ? "#D8E4EE" : ACCENT }}>▼</button>
                </div>

                {/* Position number */}
                <div style={{ width: 24, textAlign: "center", fontSize: 12, color: "#9DC4E0", fontWeight: 600 }}>{idx + 1}</div>

                <img src={ad.imageUrl} alt={ad.title} style={{ width: 64, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: ACCENT }}>{ad.title}</div>
                  <div style={{ fontSize: 12, color: "#6B8FA8" }}>
                    {new Date(ad.startedAt).toLocaleDateString()} – {new Date(ad.endedAt).toLocaleDateString()} · by {ad.user.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All ads table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #D8E4EE" }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, margin: 0 }}>All Ads at This Location</h2>
          <p style={{ fontSize: 12, color: "#6B8FA8", margin: "4px 0 0" }}>{adList.length} total</p>
        </div>
        {adList.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6B8FA8", fontSize: 14 }}>No ads submitted yet.</div>
        ) : (
          adList.map((ad, idx) => {
            const s = STATUS_STYLE[ad.status] ?? STATUS_STYLE.pending;
            return (
              <div key={ad.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderBottom: idx < adList.length - 1 ? "1px solid #D8E4EE" : "none" }}>
                <img src={ad.imageUrl} alt={ad.title} style={{ width: 60, height: 42, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: ACCENT, marginBottom: 2 }}>{ad.title}</div>
                  <div style={{ fontSize: 12, color: "#6B8FA8" }}>by {ad.user.name} · {new Date(ad.createdAt).toLocaleDateString()}</div>
                </div>
                <Badge bg={s.bg} color={s.color} label={ad.status.charAt(0).toUpperCase() + ad.status.slice(1)} />
                <Link href={`/dashboard/user/ads/${ad.id}`} style={{ fontSize: 12, color: "#4A90C4", textDecoration: "none" }}>Details</Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
