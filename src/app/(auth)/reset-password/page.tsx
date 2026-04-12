"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { resetPassword } from "@/lib/auth/client";
import { toast } from "sonner";

const label: React.CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
  color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em",
};
const input: React.CSSProperties = {
  width: "100%", height: 40, borderRadius: 8, padding: "0 12px",
  border: "1px solid #D1DDE8", background: "#F7F9FC", color: "#1A3A5C",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 8, border: "none",
  background: "#1A3A5C", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const iconCircle = (bg: string): React.CSSProperties => ({
  width: 56, height: 56, borderRadius: "50%", background: bg,
  display: "flex", alignItems: "center", justifyContent: "center",
  margin: "0 auto 16px",
});

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (!token) { toast.error("Invalid or expired reset link."); return; }
    setLoading(true);
    try {
      await resetPassword({ newPassword: password, token });
      setDone(true);
    } catch {
      toast.error("Reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={iconCircle("#EDFBF4")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
          Password updated!
        </h1>
        <p style={{ fontSize: 13, color: "#6B8FA8", margin: "0 0 24px" }}>
          Your password has been reset successfully.
        </p>
        <button
          onClick={() => router.push("/login")}
          style={primaryBtn}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 4px" }}>
        Set new password
      </h1>
      <p style={{ fontSize: 13, color: "#6B8FA8", margin: "0 0 24px" }}>
        Choose a strong password for your account.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={label}>New password</label>
          <input type="password" required placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Confirm password</label>
          <input type="password" required placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={input} />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ ...primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B8FA8" }}>
        <Link href="/login" style={{ color: "#E8563A", fontWeight: 600, textDecoration: "none" }}>
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div style={{ color: "#6B8FA8", fontSize: 14 }}>Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
