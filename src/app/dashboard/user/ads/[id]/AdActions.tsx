"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdActions({
  adId,
  status,
  isOwner,
  isAdmin,
}: {
  adId: string;
  status: string;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmRenew, setConfirmRenew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canEnd = status === "approved" && (isOwner || isAdmin);
  const canRenew = (status === "expired" || status === "cancelled") && (isOwner || isAdmin);

  if (!canEnd && !canRenew) return null;

  async function callAction(endpoint: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ads/${adId}/${endpoint}`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (endpoint === "renew") {
        router.push(`/ads/${adId}/payment`);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
      setConfirmEnd(false);
      setConfirmRenew(false);
    }
  }

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "9px 18px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid",
    background: "transparent",
    transition: "opacity 0.15s",
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {error && (
        <span style={{ fontSize: 13, color: "#991b1b", background: "#fee2e2", padding: "6px 12px", borderRadius: 6 }}>
          {error}
        </span>
      )}

      {/* END */}
      {canEnd && (
        confirmEnd ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px" }}>
            <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>End this ad early?</span>
            <button
              onClick={() => callAction("end")}
              disabled={loading}
              style={{ ...btnBase, borderColor: "#ef4444", color: "#fff", background: "#ef4444", padding: "5px 14px", fontSize: 13, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "…" : "Yes, End It"}
            </button>
            <button
              onClick={() => setConfirmEnd(false)}
              disabled={loading}
              style={{ ...btnBase, borderColor: "#D8E4EE", color: "#4A6B82", padding: "5px 12px", fontSize: 13 }}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmEnd(true)}
            style={{ ...btnBase, borderColor: "#fca5a5", color: "#991b1b", background: "#fee2e2" }}
          >
            End Ad
          </button>
        )
      )}

      {/* RENEW */}
      {canRenew && (
        confirmRenew ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px" }}>
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Renew for another 7 days? ($100 payment required)</span>
            <button
              onClick={() => callAction("renew")}
              disabled={loading}
              style={{ ...btnBase, borderColor: "#16a34a", color: "#fff", background: "#16a34a", padding: "5px 14px", fontSize: 13, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "…" : "Yes, Renew"}
            </button>
            <button
              onClick={() => setConfirmRenew(false)}
              disabled={loading}
              style={{ ...btnBase, borderColor: "#D8E4EE", color: "#4A6B82", padding: "5px 12px", fontSize: 13 }}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmRenew(true)}
            style={{ ...btnBase, borderColor: "#86efac", color: "#166534", background: "#f0fdf4" }}
          >
            Renew Ad
          </button>
        )
      )}
    </div>
  );
}
