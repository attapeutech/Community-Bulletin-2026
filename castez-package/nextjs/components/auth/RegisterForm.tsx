"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell, { FIELD, LABEL, PRIMARY, GoogleButton, OrDivider, PasswordField } from "./AuthShell";

export default function RegisterForm() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <AuthShell>
      <h1 className="mb-2 font-display text-[32px] font-bold leading-tight tracking-tighter">Create your account</h1>
      <p className="mb-7 text-[15px] text-zinc-400">Start advertising in your community today.</p>

      <label htmlFor="name" className={LABEL}>FULL NAME</label>
      <input id="name" type="text" autoComplete="name" placeholder="Jane Smith" className={`${FIELD} mb-5`} />

      <label htmlFor="email" className={LABEL}>EMAIL ADDRESS</label>
      <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={`${FIELD} mb-5`} />

      <label htmlFor="password" className={LABEL}>PASSWORD</label>
      <PasswordField id="password" autoComplete="new-password" placeholder="Min. 8 characters" show={showPass} onToggle={() => setShowPass((s) => !s)} className="mb-5" />

      <label htmlFor="confirm" className={LABEL}>CONFIRM PASSWORD</label>
      <PasswordField id="confirm" autoComplete="new-password" placeholder="Re-enter password" show={showConfirm} onToggle={() => setShowConfirm((s) => !s)} className="mb-4" />

      <p className="mb-5 text-[13px] leading-relaxed text-zinc-500">
        By creating an account you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
      </p>

      <button type="submit" className={PRIMARY}>Create account</button>

      <OrDivider />
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account? <Link href="/login" className="font-bold">Sign in</Link>
      </p>
    </AuthShell>
  );
}
