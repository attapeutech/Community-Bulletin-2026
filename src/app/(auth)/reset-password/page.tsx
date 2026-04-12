"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { resetPassword } from "@/lib/auth/client";
import { toast } from "sonner";

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

  const inputStyle = { border: "1px solid #D1DDE8", background: "#F7F9FC", color: "#1A3A5C", fontSize: 14 };
  const labelStyle = { fontSize: 11, color: "#4A5568", letterSpacing: "0.04em" };

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#EDFBF4" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="font-serif font-bold mb-2" style={{ fontSize: 21, color: "#1A3A5C" }}>Password updated!</h1>
        <p className="mb-6" style={{ fontSize: 13, color: "#6B8FA8" }}>Your password has been reset successfully.</p>
        <button
          onClick={() => router.push("/login")}
          className="w-full h-11 rounded-lg font-semibold text-white"
          style={{ background: "#1A3A5C", fontSize: 14 }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-serif font-bold mb-1" style={{ fontSize: 21, color: "#1A3A5C" }}>Set new password</h1>
      <p className="mb-6" style={{ fontSize: 13, color: "#6B8FA8" }}>Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 font-semibold uppercase tracking-wider" style={labelStyle}>New password</label>
          <input type="password" required placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 rounded-lg px-3 outline-none" style={inputStyle}/>
        </div>
        <div>
          <label className="block mb-1 font-semibold uppercase tracking-wider" style={labelStyle}>Confirm password</label>
          <input type="password" required placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full h-10 rounded-lg px-3 outline-none" style={inputStyle}/>
        </div>
        <button type="submit" disabled={loading} className="w-full h-11 rounded-lg font-semibold text-white disabled:opacity-60" style={{ background: "#1A3A5C", fontSize: 14 }}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="text-center mt-5" style={{ fontSize: 13, color: "#6B8FA8" }}>
        <Link href="/login" style={{ color: "#E8563A", fontWeight: 600 }}>Back to sign in</Link>
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
