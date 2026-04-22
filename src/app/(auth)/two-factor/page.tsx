"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";

function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "#FEF2F2", border: "1px solid #fca5a5", borderRadius: 8,
      padding: "10px 14px", marginBottom: 16,
      display: "flex", gap: 8, alignItems: "flex-start",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="10" stroke="#b91c1c" strokeWidth="1.5"/>
        <path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 13, color: "#b91c1c" }}>{msg}</span>
    </div>
  );
}

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    sendCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode() {
    setResending(true);
    try {
      await fetch("/api/auth/2fa/send", { method: "POST" });
      setSent(true);
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) { setFormError("Please enter the 6-digit code."); return; }
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Invalid code. Please try again.");
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "#EEF6FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
          Check your email
        </h1>
        <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6, margin: 0 }}>
          {sent
            ? "We sent a 6-digit verification code to your email address."
            : "Sending your verification code…"}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{
            display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
            color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            Verification code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
            autoComplete="one-time-code"
            style={{
              width: "100%", height: 52, borderRadius: 8, padding: "0 12px",
              border: "1px solid #D1DDE8", background: "#F7F9FC", color: "#1A3A5C",
              fontSize: 26, outline: "none", textAlign: "center",
              fontFamily: "monospace", letterSpacing: "0.4em", boxSizing: "border-box",
            }}
          />
        </div>

        <FormError msg={formError} />

        <button
          type="submit"
          disabled={loading || !sent}
          style={{
            width: "100%", height: 44, borderRadius: 8, border: "none",
            background: "#1A3A5C", color: "#fff", fontSize: 14, fontWeight: 600,
            opacity: (loading || !sent) ? 0.6 : 1,
            cursor: (loading || !sent) ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B8FA8" }}>
        Didn&apos;t receive it?{" "}
        <button
          onClick={sendCode}
          disabled={resending}
          style={{
            color: "#4A90C4", fontWeight: 600, background: "none",
            border: "none", cursor: resending ? "not-allowed" : "pointer",
            fontSize: 13, opacity: resending ? 0.6 : 1,
          }}
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>
    </AuthLayout>
  );
}
