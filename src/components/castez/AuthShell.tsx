"use client";

import { forwardRef, useState, type ReactNode } from "react";
import { Logo } from "./Brand";

// Ported from castez-package/nextjs/components/auth/AuthShell.tsx onto the
// ce-* tokens. The design's own version hardcodes zinc/emerald and wraps its
// children in a stubbed <form>; here the page owns the form so react-hook-form
// keeps control of submission.

export const LABEL = "mb-2 block font-ce-mono text-[11px] tracking-[0.14em] text-ce-muted";

export const FIELD =
  "w-full rounded-xl border border-ce-line4 bg-ce-card px-4 py-3 text-[15px] text-ce-text outline-none transition placeholder:text-ce-muted4 focus:border-ce-accent focus:ring-[3px] focus:ring-ce-accent/15";

export const FIELD_ERROR = "border-red-500/70 focus:border-red-500 focus:ring-red-500/15";

export const PRIMARY =
  "w-full rounded-xl bg-[linear-gradient(180deg,#5cf0dd,#26cdb9)] px-4 py-[15px] text-[15px] font-bold text-ce-onAccent transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

export const SECONDARY =
  "w-full rounded-xl border border-ce-line4 bg-white/[0.02] px-4 py-3.5 text-[15px] font-semibold text-ce-text2 transition hover:border-ce-line5 hover:bg-white/5";

export const GLOW = {
  boxShadow: "0 14px 40px -12px rgba(62,230,209,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
};

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-red-400">{msg}</p>;
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3.5">
      <div className="h-px flex-1 bg-ce-line3" />
      <span className="font-ce-mono text-[11px] text-ce-muted4">OR</span>
      <div className="h-px flex-1 bg-ce-line3" />
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${SECONDARY} flex items-center justify-center gap-2.5`}
    >
      <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8a10 10 0 0 1-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.3z"
        />
        <path
          fill="#34A853"
          d="M24 46c6 0 11-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7A22 22 0 0 0 24 46z"
        />
        <path fill="#FBBC05" d="M11.8 28.4a13.2 13.2 0 0 1 0-8.4v-5.7H4.5a22 22 0 0 0 0 19.8l7.3-5.7z" />
        <path
          fill="#EA4335"
          d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 30 2 24 2 15.4 2 8 6.9 4.5 14.3l7.3 5.7c1.7-5.2 6.5-9.6 12.2-9.6z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

/** Password input with the design's eye toggle. Forwards ref so it works with
 *  react-hook-form's register(). */
export const PasswordField = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(function PasswordField({ className = "", hasError, ...props }, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? "text" : "password"}
        className={`${FIELD} ${hasError ? FIELD_ERROR : ""} pr-12 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className={`absolute right-1.5 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-lg transition ${
          show ? "text-ce-accent" : "text-ce-muted3 hover:text-ce-text4"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {show && <line x1="3" y1="21" x2="21" y2="3" />}
        </svg>
      </button>
    </div>
  );
});

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ce-ground px-6 py-10 text-ce-text">
      <div
        className="pointer-events-none absolute -top-[220px] left-1/2 h-[520px] w-[min(820px,100vw)] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(62,230,209,0.14), rgba(79,124,255,0.06) 55%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-[440px]">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" />
        </div>

        <div
          className="rounded-[20px] border border-ce-line3 bg-ce-surface/70 px-8 pb-8 pt-9 backdrop-blur-xl"
          style={{ boxShadow: "0 40px 80px -40px rgba(0,0,0,0.9)" }}
        >
          {children}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inset-0 animate-ce-pulse rounded-full bg-ce-accent" />
            <span className="relative h-[7px] w-[7px] rounded-full bg-ce-accent" />
          </span>
          <span className="font-ce-mono text-[11px] tracking-wide text-ce-muted4">
            NETWORK ONLINE
          </span>
        </div>
      </div>
    </div>
  );
}
