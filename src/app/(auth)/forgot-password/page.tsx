"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthShell, {
  FIELD,
  FIELD_ERROR,
  FieldError,
  GLOW,
  LABEL,
  PRIMARY,
} from "@/components/castez/AuthShell";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const emailValue = watch("email", "");

  async function onSubmit(data: FormData) {
    setFormError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, redirectTo: "/reset-password" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "No account found with that email address.");
        return;
      }
      setSent(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-ce-accent/40 bg-ce-accent/10">
          <MailCheck size={22} className="text-ce-accent" />
        </div>
        <h1 className="mb-2 font-ce-display text-[32px] font-bold leading-tight tracking-tighter text-ce-text">
          Check your inbox
        </h1>
        <p className="mb-5 text-[15px] leading-relaxed text-ce-muted">
          We sent a password reset link to{" "}
          <strong className="font-semibold text-ce-text">{emailValue}</strong>. The link expires in
          one hour.
        </p>
        <p className="text-[13px] text-ce-muted3">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-semibold text-ce-accent transition hover:text-ce-accentLight"
          >
            try a different address
          </button>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="mb-2 font-ce-display text-[32px] font-bold leading-tight tracking-tighter text-ce-text">
        Reset your password
      </h1>
      <p className="mb-7 text-[15px] leading-relaxed text-ce-muted">
        Enter the email on your account and we&apos;ll send you a link to set a new password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="email" className={LABEL}>
          EMAIL ADDRESS
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          className={`${FIELD} ${errors.email ? FIELD_ERROR : ""}`}
          {...register("email")}
        />
        <FieldError msg={errors.email?.message} />

        {formError && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-3">
            <AlertCircle size={18} className="mt-px shrink-0 text-red-400" />
            <p className="text-[13px] text-red-300">{formError}</p>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={`${PRIMARY} mt-6`} style={GLOW}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ce-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-ce-accent hover:text-ce-accentLight">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
