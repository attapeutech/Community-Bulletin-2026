"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell, { FIELD, LABEL, PRIMARY, SECONDARY } from "./AuthShell";

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  return (
    <AuthShell>
      {!sent ? (
        <>
          <h1 className="mb-2.5 font-display text-[32px] font-bold leading-tight tracking-tighter">Forgot your password?</h1>
          <p className="mb-7 text-[15px] leading-relaxed text-zinc-400">Enter the email address for your account and we&apos;ll send you a reset link.</p>

          <label htmlFor="email" className={LABEL}>EMAIL ADDRESS</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={`${FIELD} mb-5`} />

          <button type="button" onClick={() => setSent(true)} className={PRIMARY}>Send reset link</button>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-300/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m4 7 8 6 8-6" />
              <rect x="3" y="5" width="18" height="14" rx="3" />
            </svg>
          </div>
          <h1 className="mb-2.5 font-display text-[28px] font-bold leading-tight tracking-tighter">Check your inbox</h1>
          <p className="mb-6 text-[15px] leading-relaxed text-zinc-400">If that address has a CastEZ account, a reset link is on its way. The link expires in 30 minutes.</p>
          <button type="button" onClick={() => setSent(false)} className={SECONDARY}>Use a different email</button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-zinc-400">
        Remembered it? <Link href="/login" className="font-bold">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
