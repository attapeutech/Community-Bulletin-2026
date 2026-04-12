"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgetPassword } from "@/lib/auth/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgetPassword({
        email,
        redirectTo: "/reset-password",
      });
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
        <div className="text-center py-4">
          <div
            className="mx-auto mb-4 flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: "#EEF6FF" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-serif font-bold mb-2" style={{ fontSize: 21, color: "#1A3A5C" }}>
            Check your email
          </h1>
          <p className="mb-6" style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6 }}>
            We sent a password reset link to <strong style={{ color: "#1A3A5C" }}>{email}</strong>.
            The link expires in 1 hour.
          </p>
          <p style={{ fontSize: 12, color: "#9DC4E0" }}>
            Didn&apos;t receive it?{" "}
            <button
              onClick={() => setSent(false)}
              style={{ color: "#4A90C4", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-serif font-bold mb-1" style={{ fontSize: 21, color: "#1A3A5C" }}>
            Forgot your password?
          </h1>
          <p className="mb-6" style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6 }}>
            Enter the email address for your account and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="block mb-1 font-semibold uppercase tracking-wider"
                style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.04em" }}
              >
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-lg px-3 outline-none"
                style={{ border: "1px solid #D1DDE8", background: "#F7F9FC", color: "#1A3A5C", fontSize: 14 }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg font-semibold text-white disabled:opacity-60"
              style={{ background: "#1A3A5C", fontSize: 14 }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="text-center mt-5" style={{ fontSize: 13, color: "#6B8FA8" }}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "#E8563A", fontWeight: 600 }}>
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
