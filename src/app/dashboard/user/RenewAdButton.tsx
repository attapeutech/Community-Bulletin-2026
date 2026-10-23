"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RenewAdButton({ adId }: { adId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRenew() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${adId}/renew`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRenew}
      disabled={loading}
      style={{
        fontSize: 12,
        fontWeight: 600,
        background: "#1A3A5C",
        color: "#fff",
        padding: "6px 14px",
        borderRadius: 6,
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Renewing…" : "Renew"}
    </button>
  );
}
