"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell, { FIELD, LABEL, PRIMARY, GoogleButton, OrDivider, PasswordField } from "./AuthShell";

export default function LoginForm() {
  const [show, setShow] = useState(false);

  return (
    <AuthShell>
      <h1 className="mb-2 font-display text-[32px] font-bold leading-tight tracking-tighter">Welcome back</h1>
      <p className="mb-7 text-[15px] text-zinc-400">
        Sign in to your <span className="font-semibold text-zinc-100">CastEZ</span> account
      </p>

      <label htmlFor="email" className={LABEL}>EMAIL ADDRESS</label>
      <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={`${FIELD} mb-5`} />

      <label htmlFor="password" className={LABEL}>PASSWORD</label>
      <PasswordField id="password" autoComplete="current-password" placeholder="••••••••" show={show} onToggle={() => setShow((s) => !s)} className="mb-3" />

      <div className="mb-5 flex justify-end">
        <Link href="/forgot-password" className="text-[13px] font-semibold">Forgot password?</Link>
      </div>

      <button type="submit" className={PRIMARY}>Sign in</button>

      <OrDivider />
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-zinc-400">
        Don&apos;t have an account? <Link href="/register" className="font-bold">Create one free</Link>
      </p>
    </AuthShell>
  );
}
