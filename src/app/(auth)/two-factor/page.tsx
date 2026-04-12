"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { twoFactor } from "@/lib/auth/client";
import { toast } from "sonner";

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
        await twoFactor.verifyBackupCode({ code, callbackURL: "/dashboard" });
      } else {
        await twoFactor.verifyTotp({ code, callbackURL: "/dashboard" });
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
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#EEF6FF" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#4A90C4" strokeWidth="1.5"/>
            <path d="M8 11V7a4 4 0 018 0v4" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="#4A90C4"/>
          </svg>
        </div>
        <h1 className="font-serif font-bold mb-1" style={{ fontSize: 21, color: "#1A3A5C" }}>
          Two-factor verification
        </h1>
        <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6 }}>
          {useBackup
            ? "Enter one of your backup codes to access your account."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 font-semibold uppercase tracking-wider" style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.04em" }}>
            {useBackup ? "Backup code" : "Authenticator code"}
          </label>
          <input
            type="text"
            required
            placeholder={useBackup ? "xxxxxxxx" : "000000"}
            maxLength={useBackup ? 10 : 6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            className="w-full h-12 rounded-lg px-3 outline-none text-center font-mono tracking-widest"
            style={{ border: "1px solid #D1DDE8", background: "#F7F9FC", color: "#1A3A5C", fontSize: 22, letterSpacing: "0.3em" }}
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg font-semibold text-white disabled:opacity-60"
          style={{ background: "#1A3A5C", fontSize: 14 }}
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>

      <p className="text-center mt-5" style={{ fontSize: 13, color: "#6B8FA8" }}>
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
