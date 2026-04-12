"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { twoFactor } from "@/lib/auth/client";
import { toast } from "sonner";

const primaryBtn: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 8, border: "none",
  background: "#1A3A5C", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
};

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) { toast.error("Please enter a valid code."); return; }
    setLoading(true);
    try {
      if (useBackup) {
        await twoFactor.verifyBackupCode({ code });
      } else {
        await twoFactor.verifyTotp({ code });
      }
      router.push("/dashboard");
    } catch {
      toast.error("Invalid code. Please try again.");
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
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#4A90C4" strokeWidth="1.5"/>
            <path d="M8 11V7a4 4 0 018 0v4" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="#4A90C4"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
          Two-factor verification
        </h1>
        <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6, margin: 0 }}>
          {useBackup
            ? "Enter one of your backup codes to access your account."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{
            display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
            color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            {useBackup ? "Backup code" : "Authenticator code"}
          </label>
          <input
            type="text"
            required
            placeholder={useBackup ? "xxxxxxxx" : "000000"}
            maxLength={useBackup ? 10 : 6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            style={{
              width: "100%", height: 48, borderRadius: 8, padding: "0 12px",
              border: "1px solid #D1DDE8", background: "#F7F9FC", color: "#1A3A5C",
              fontSize: 22, outline: "none", textAlign: "center",
              fontFamily: "monospace", letterSpacing: "0.3em", boxSizing: "border-box",
            }}
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B8FA8" }}>
        <button
          onClick={() => { setUseBackup(!useBackup); setCode(""); }}
          style={{ color: "#4A90C4", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
        >
          {useBackup ? "Use authenticator app instead" : "Use a backup code instead"}
        </button>
      </p>
    </AuthLayout>
  );
}
