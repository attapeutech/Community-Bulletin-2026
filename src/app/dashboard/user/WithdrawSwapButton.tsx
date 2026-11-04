"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Withdraw the new version of an ad that's waiting for review (the current ad keeps running)
export function WithdrawSwapButton({ adId }: { adId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleWithdraw() {
    if (!window.confirm("Withdraw the new version? Your current ad keeps running.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${adId}/swap`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleWithdraw}
      disabled={loading}
      style={{ fontSize: 11, color: "#4A90C4", background: "none", border: "none", padding: 0, cursor: loading ? "not-allowed" : "pointer", textDecoration: "underline" }}
    >
      {loading ? "Withdrawing…" : "Withdraw"}
    </button>
  );
}
