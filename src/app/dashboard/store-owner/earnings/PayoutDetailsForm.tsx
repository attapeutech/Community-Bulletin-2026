"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#1A3A5C";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 8,
  border: "1px solid #D1DDE8", background: "#F7F9FC", color: ACCENT, boxSizing: "border-box",
};

export default function PayoutDetailsForm({
  initialMethod, initialZelle, initialAddress,
}: {
  initialMethod: string | null; initialZelle: string | null; initialAddress: string | null;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"zelle" | "check">(initialMethod === "check" ? "check" : "zelle");
  const [zelle, setZelle] = useState(initialZelle ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body = method === "zelle"
        ? { payoutMethod: "zelle", payoutZelle: zelle }
        : { payoutMethod: "check", payoutMailingAddress: address };
      const res = await fetch("/api/user/payout-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ ok: true, text: "Payout details saved." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: json.error ?? "Could not save." });
      }
    } catch {
      setMessage({ ok: false, text: "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const radio = (value: "zelle" | "check", label: string) => (
    <label style={{
      display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: ACCENT,
      padding: "8px 14px", borderRadius: 8, border: `1px solid ${method === value ? ACCENT : "#D1DDE8"}`,
      background: method === value ? "#F0F5FA" : "#fff", fontWeight: method === value ? 600 : 400,
    }}>
      <input type="radio" name="payoutMethod" checked={method === value} onChange={() => setMethod(value)} />
      {label}
    </label>
  );

  return (
    <form onSubmit={save} style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "18px 20px" }}>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: ACCENT, margin: "0 0 4px" }}>
        Payout Details
      </h2>
      <p style={{ fontSize: 13, color: "#4A6B82", margin: "0 0 14px" }}>
        Where should we send your earnings? Payouts go out monthly.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {radio("zelle", "Zelle")}
        {radio("check", "Mailed check")}
      </div>

      {method === "zelle" ? (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#4A6B82", display: "block", marginBottom: 6 }}>
            Zelle email or phone
          </label>
          <input style={inputStyle} value={zelle} onChange={e => setZelle(e.target.value)} placeholder="you@example.com or (555) 123-4567" />
        </div>
      ) : (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#4A6B82", display: "block", marginBottom: 6 }}>
            Mailing address for checks
          </label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={address} onChange={e => setAddress(e.target.value)}
            placeholder={"Name\nStreet address\nCity, State ZIP"} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        <button type="submit" disabled={saving} style={{
          background: ACCENT, color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8,
          fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Saving…" : "Save payout details"}
        </button>
        {message && (
          <span style={{ fontSize: 13, color: message.ok ? "#166534" : "#B91C1C" }}>{message.text}</span>
        )}
      </div>
    </form>
  );
}
