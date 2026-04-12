"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgetPassword } from "@/lib/auth/client";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgetPassword({ email, redirectTo: "/reset-password" });
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {sent ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={iconCircle("#EEF6FF")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
            Check your email
          </h1>
          <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6, margin: "0 0 20px" }}>
            We sent a password reset link to <strong style={{ color: "#1A3A5C" }}>{email}</strong>.{" "}
            The link expires in 1 hour.
          </p>
          <p style={{ fontSize: 12, color: "#9DC4E0" }}>
            Didn&apos;t receive it?{" "}
            <button
              onClick={() => setSent(false)}
              style={{ color: "#4A90C4", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
            >
              Try again
            </button>
          </p>
        </div>
      ) : (
        <>
          <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 4px" }}>
            Forgot your password?
          </h1>
          <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6, margin: "0 0 24px" }}>
            Enter the email address for your account and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={label}>Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B8FA8" }}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "#E8563A", fontWeight: 600, textDecoration: "none" }}>
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
