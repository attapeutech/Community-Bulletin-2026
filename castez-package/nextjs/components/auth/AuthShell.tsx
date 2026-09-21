"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export const LABEL = "mb-2 block font-mono text-[11px] tracking-[0.14em] text-zinc-400";
export const FIELD =
  "w-full rounded-xl border border-zinc-800 bg-panel px-4 py-3 text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-300 focus:ring-[3px] focus:ring-emerald-300/15";
export const PRIMARY =
  "w-full rounded-xl bg-gradient-to-b from-[#5cf0dd] to-[#26cdb9] px-4 py-[15px] text-[15px] font-bold text-brand-ink shadow-glow transition hover:brightness-110";
export const SECONDARY =
  "w-full rounded-xl border border-zinc-800 bg-white/[0.02] px-4 py-3.5 text-[15px] font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-white/5";

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3.5">
      <div className="h-px flex-1 bg-hairline" />
      <span className="font-mono text-[11px] text-zinc-600">OR</span>
      <div className="h-px flex-1 bg-hairline" />
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${SECONDARY} flex items-center justify-center gap-2.5`}>
      <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8a10 10 0 0 1-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.3z" />
        <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7A22 22 0 0 0 24 46z" />
        <path fill="#FBBC05" d="M11.8 28.4a13.2 13.2 0 0 1 0-8.4v-5.7H4.5a22 22 0 0 0 0 19.8l7.3-5.7z" />
        <path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 30 2 24 2 15.4 2 8 6.9 4.5 14.3l7.3 5.7c1.7-5.2 6.5-9.6 12.2-9.6z" />
      </svg>
      Continue with Google
    </button>
  );
}

export function PasswordField({
  id,
  placeholder,
  autoComplete,
  show,
  onToggle,
  className = "",
}: {
  id: string;
  placeholder: string;
  autoComplete: string;
  show: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} placeholder={placeholder} className={`${FIELD} pr-12`} />
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle password visibility"
        className={`absolute right-1.5 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-lg transition ${
          show ? "text-emerald-300" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {show && <line x1="3" y1="21" x2="21" y2="3" />}
        </svg>
      </button>
    </div>
  );
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 py-10 text-zinc-100">
      <div className="pointer-events-none absolute -top-[220px] left-1/2 h-[520px] w-[820px] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(62,230,209,0.14),rgba(79,124,255,0.06)_55%,transparent_75%)]" />
      <div className="relative w-full max-w-[440px]">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5 text-zinc-100 hover:text-zinc-100">
          <span className="h-6 w-6 rounded-[7px] bg-gradient-to-br from-emerald-300 to-indigo-500 shadow-[0_0_18px_rgba(62,230,209,0.45)]" />
          <span className="font-display text-[17px] font-bold tracking-tight">
            casteasy<span className="text-zinc-500">.io</span>
          </span>
        </Link>

        <form onSubmit={(e) => e.preventDefault()} className="rounded-[20px] border border-hairline bg-[#0d0f13]/70 px-8 pb-8 pt-9 shadow-panel backdrop-blur-xl">
          {children}
        </form>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300" />
            <span className="relative h-[7px] w-[7px] rounded-full bg-emerald-300" />
          </span>
          <span className="font-mono text-[11px] tracking-wide text-zinc-600">NETWORK ONLINE · 412 SCREENS BROADCASTING</span>
        </div>
      </div>
    </div>
  );
}
