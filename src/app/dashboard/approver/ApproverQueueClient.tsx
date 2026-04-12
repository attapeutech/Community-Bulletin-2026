"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboardSocket } from "@/lib/socket/client";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  location: { id: string; storeName: string; slug: string; addressLine1: string };
};

const ACCENT = "#1A3A5C";

export default function ApproverQueueClient({ initialAds }: { initialAds: Ad[] }) {
  const [queue, setQueue] = useState<Ad[]>(initialAds);
  const [selected, setSelected] = useState<Ad | null>(null);
  const [mode, setMode] = useState<"approve" | "deny" | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Live updates via Socket.io
  const onAdStatusChanged = useCallback(
    (payload: { adId: string; status: string }) => {
      if (payload.status !== "pending") {
        setQueue((prev) => prev.filter((a) => a.id !== payload.adId));
        if (selected?.id === payload.adId) {
          setSelected(null);
          setMode(null);
        }
      }
    },
    [selected]
  );
  useDashboardSocket(onAdStatusChanged);

  // Refresh queue from server (called after action)
  const refreshQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/ads/pending");
      const json = await res.json();
      if (json.success) setQueue(json.data);
    } catch { /* ignore */ }
  }, []);

  const handleApprove = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${selected.id}/approve`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`"${selected.title}" approved and live!`, true);
      setQueue((prev) => prev.filter((a) => a.id !== selected.id));
      setSelected(null);
      setMode(null);
    } catch (e: any) {
      showToast(e.message || "Approval failed", false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!selected || !reviewNote.trim()) return;
    if (reviewNote.trim().length < 10) {
      showToast("Review note must be at least 10 characters", false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${selected.id}/deny`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: reviewNote.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`"${selected.title}" denied. Refund initiated.`, true);
      setQueue((prev) => prev.filter((a) => a.id !== selected.id));
      setSelected(null);
      setMode(null);
      setReviewNote("");
    } catch (e: any) {
      showToast(e.message || "Denial failed", false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: "12px 20px",
          borderRadius: 10,
          background: toast.ok ? "#166534" : "#991b1b",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          maxWidth: 380,
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT }}>
          Review Ads
        </h1>
        <div style={{ fontSize: 13, color: "#6B8FA8" }}>
          {queue.length} ad{queue.length !== 1 ? "s" : ""} awaiting review
        </div>
      </div>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
        Ads are shown only after payment is confirmed. Review image, title, and content before approving.
      </p>

      {queue.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D8E4EE", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, marginBottom: 8 }}>All caught up!</h2>
          <p style={{ color: "#6B8FA8", fontSize: 14 }}>No ads are currently pending review.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 24 }}>
          {/* Queue list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {queue.map((ad) => (
              <button
                key={ad.id}
                onClick={() => { setSelected(ad); setMode(null); setReviewNote(""); }}
                style={{
                  background: selected?.id === ad.id ? "#EBF4FF" : "#fff",
                  border: selected?.id === ad.id ? "2px solid #4A90C4" : "1px solid #D8E4EE",
                  borderRadius: 12,
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  width: "100%",
                }}
              >
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: ACCENT, marginBottom: 2 }}>{ad.title}</div>
                  <div style={{ fontSize: 12, color: "#6B8FA8" }}>{ad.location.storeName}</div>
                  <div style={{ fontSize: 11, color: "#9DC4E0", marginTop: 4 }}>
                    By {ad.user.name} · {new Date(ad.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 24, position: "sticky", top: 24 }}>
              {/* Ad preview */}
              <img
                src={selected.imageUrl}
                alt={selected.title}
                style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, marginBottom: 16 }}
              />

              <h3 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, marginBottom: 4 }}>{selected.title}</h3>
              {selected.description && (
                <p style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 12 }}>{selected.description}</p>
              )}

              <div style={{ display: "grid", gap: 6, fontSize: 12, marginBottom: 20 }}>
                <div><span style={{ color: "#9DC4E0" }}>Location: </span>{selected.location.storeName}</div>
                <div><span style={{ color: "#9DC4E0" }}>Address: </span>{selected.location.addressLine1}</div>
                <div><span style={{ color: "#9DC4E0" }}>Submitted by: </span>{selected.user.name} ({selected.user.email})</div>
                <div><span style={{ color: "#9DC4E0" }}>Submitted: </span>
                  {new Date(selected.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
                </div>
              </div>

              {/* Quick-view display screen */}
              <a
                href={`/display/${selected.location.slug}`}
                target="_blank"
                style={{ fontSize: 12, color: "#4A90C4", textDecoration: "none", display: "inline-block", marginBottom: 20 }}
              >
                Preview display screen ↗
              </a>

              {/* Action buttons */}
              {!mode && (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setMode("approve")}
                    style={{
                      flex: 1, padding: "10px 16px", background: "#16a34a", color: "#fff",
                      border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setMode("deny")}
                    style={{
                      flex: 1, padding: "10px 16px", background: "#dc2626", color: "#fff",
                      border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    ✕ Deny
                  </button>
                </div>
              )}

              {/* Confirm approve */}
              {mode === "approve" && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 16 }}>
                  <p style={{ fontSize: 13, color: "#166534", marginBottom: 12 }}>
                    This ad will go live immediately for 30 days. The advertiser will be notified.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      style={{
                        flex: 1, padding: "10px 16px", background: "#16a34a", color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? "Approving…" : "Confirm Approve"}
                    </button>
                    <button
                      onClick={() => setMode(null)}
                      style={{ padding: "10px 16px", background: "#E8EFF6", color: ACCENT, border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Deny form */}
              {mode === "deny" && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#991b1b", marginBottom: 6 }}>
                    Reason for denial *
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Explain why the ad is not approved (visible to advertiser)…"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #fca5a5",
                      borderRadius: 6,
                      fontSize: 13,
                      resize: "vertical",
                      marginBottom: 12,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleDeny}
                      disabled={loading || reviewNote.trim().length < 10}
                      style={{
                        flex: 1, padding: "10px 16px", background: "#dc2626", color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                        cursor: (loading || reviewNote.trim().length < 10) ? "not-allowed" : "pointer",
                        opacity: (loading || reviewNote.trim().length < 10) ? 0.7 : 1,
                      }}
                    >
                      {loading ? "Denying…" : "Confirm Deny & Refund"}
                    </button>
                    <button
                      onClick={() => { setMode(null); setReviewNote(""); }}
                      style={{ padding: "10px 16px", background: "#E8EFF6", color: ACCENT, border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
