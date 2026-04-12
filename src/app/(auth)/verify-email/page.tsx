"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { verifyEmail } from "@/lib/auth/client";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    verifyEmail({ query: { token } })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="text-center py-4">
      {status === "loading" && (
        <>
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#EEF6FF" }}>
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#4A90C4" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12"/>
            </svg>
          </div>
          <h1 className="font-serif font-bold mb-2" style={{ fontSize: 21, color: "#1A3A5C" }}>Verifying your email…</h1>
          <p style={{ fontSize: 13, color: "#6B8FA8" }}>Please wait a moment.</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#EDFBF4" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-serif font-bold mb-2" style={{ fontSize: 21, color: "#1A3A5C" }}>Email verified!</h1>
          <p className="mb-6" style={{ fontSize: 13, color: "#6B8FA8" }}>Your email has been verified. You can now sign in.</p>
          <button onClick={() => router.push("/login")} className="w-full h-11 rounded-lg font-semibold text-white" style={{ background: "#1A3A5C", fontSize: 14 }}>
            Go to sign in
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#FEF2F2" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-serif font-bold mb-2" style={{ fontSize: 21, color: "#1A3A5C" }}>Link expired</h1>
          <p className="mb-6" style={{ fontSize: 13, color: "#6B8FA8" }}>This verification link is invalid or has expired. Please request a new one.</p>
          <button onClick={() => router.push("/login")} className="w-full h-11 rounded-lg font-semibold text-white" style={{ background: "#1A3A5C", fontSize: 14 }}>
            Back to sign in
          </button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div style={{ color: "#6B8FA8", fontSize: 14, textAlign: "center" }}>Loading…</div>}>
        <VerifyContent />
      </Suspense>
    </AuthLayout>
  );
}
