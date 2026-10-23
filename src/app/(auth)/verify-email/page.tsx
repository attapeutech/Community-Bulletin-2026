"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { verifyEmail } from "@/lib/auth/client";

const primaryBtn: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 8, border: "none",
  background: "#1A3A5C", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const iconCircle = (bg: string): React.CSSProperties => ({
  width: 56, height: 56, borderRadius: "50%", background: bg,
  display: "flex", alignItems: "center", justifyContent: "center",
  margin: "0 auto 16px",
});

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
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      {status === "loading" && (
        <>
          <div style={iconCircle("#EEF6FF")}>
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <circle cx="12" cy="12" r="10" stroke="#4A90C4" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
            Verifying your email…
          </h1>
          <p style={{ fontSize: 13, color: "#4A6B82", margin: 0 }}>Please wait a moment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={iconCircle("#EDFBF4")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
            Email verified!
          </h1>
          <p style={{ fontSize: 13, color: "#4A6B82", margin: "0 0 24px" }}>
            Your email has been verified. You can now sign in.
          </p>
          <button onClick={() => router.push("/login")} style={primaryBtn}>
            Go to sign in
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div style={iconCircle("#FEF2F2")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
            Link expired
          </h1>
          <p style={{ fontSize: 13, color: "#4A6B82", margin: "0 0 24px" }}>
            This verification link is invalid or has expired. Please request a new one.
          </p>
          <button onClick={() => router.push("/login")} style={primaryBtn}>
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
      <Suspense fallback={<div style={{ color: "#4A6B82", fontSize: 14, textAlign: "center" }}>Loading…</div>}>
        <VerifyContent />
      </Suspense>
    </AuthLayout>
  );
}
