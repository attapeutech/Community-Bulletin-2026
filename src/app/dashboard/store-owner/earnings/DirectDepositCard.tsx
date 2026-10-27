"use client";

import { useState } from "react";
import type { DirectDepositStatus } from "@/lib/direct-deposits";

const ACCENT = "#1A3A5C";

const STATUS: Record<DirectDepositStatus, { label: string; bg: string; color: string }> = {
  not_set_up: { label: "Not set up", bg: "#FEF3C7", color: "#92400E" },
  incomplete: { label: "Incomplete", bg: "#FEF3C7", color: "#92400E" },
  active:     { label: "Active",     bg: "#DCFCE7", color: "#166534" },
};

const buttonStyle: React.CSSProperties = {
  background: ACCENT, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8,
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};

/** Store owner's direct-deposit setup (Stripe Connect Express) on the Earnings page */
export default function DirectDepositCard({ status, testMode, availableCents }: {
  status: DirectDepositStatus;
  testMode: boolean;
  availableCents: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const st = STATUS[status];

  // Both endpoints return a one-time Stripe URL; the owner leaves our site to use it
  async function go(endpoint: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      window.location.href = json.data.url;
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${status === "active" ? "#BBF7D0" : "#D8E4EE"}`, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: ACCENT, margin: 0 }}>Direct Deposit</h2>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
        {testMode && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF3C7", color: "#92400E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Test mode
          </span>
        )}
      </div>

      {status === "active" ? (
        <>
          <p style={{ fontSize: 13, color: "#4A6B82", margin: "6px 0 14px", lineHeight: 1.6 }}>
            You&apos;re all set. On the <strong>15th of each month</strong>, your available balance (if it&apos;s at least $25) is sent
            to your bank automatically. It usually arrives in 2–3 business days. You&apos;ll get an email each time.
          </p>
          <button type="button" disabled={busy} onClick={() => go("/api/stripe/connect/dashboard")} style={{ ...buttonStyle, background: "#fff", color: ACCENT, border: "1px solid #D1DDE8", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Opening Stripe…" : "View payouts & bank details on Stripe ↗"}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#4A6B82", margin: "6px 0 14px", lineHeight: 1.6 }}>
            {status === "incomplete"
              ? "Your setup isn't finished yet. Pick up where you left off — it only takes a few minutes."
              : "Get your earnings deposited straight into your bank account every month."}
            {" "}Stripe, our payment partner, securely collects your bank and tax details (W-9); we never see your bank account number.
            {availableCents > 0 && <strong style={{ color: "#92400E" }}> You have earnings waiting — finish setup so we can pay you.</strong>}
          </p>
          <button type="button" disabled={busy} onClick={() => go("/api/stripe/connect/onboard")} style={{ ...buttonStyle, opacity: busy ? 0.7 : 1 }}>
            {busy ? "Opening Stripe…" : status === "incomplete" ? "Finish direct deposit setup →" : "Get paid by direct deposit →"}
          </button>
        </>
      )}
      {error && <p style={{ fontSize: 13, color: "#B91C1C", margin: "10px 0 0" }}>{error}</p>}
    </div>
  );
}
