"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AuthShell, {
  FIELD,
  FIELD_ERROR,
  FieldError,
  GLOW,
  GoogleButton,
  LABEL,
  OrDivider,
  PRIMARY,
  PasswordField,
} from "@/components/castez/AuthShell";
import { sendVerificationEmail, signIn, useSession } from "@/lib/auth/client";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  async function onSubmit(data: FormData) {
    setFormError(null);
    setUnverifiedEmail(null);
    try {
      const check = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const { exists } = await check.json();
      if (!exists) {
        setFormError("No account found with that email address.");
        return;
      }

      await signIn.email({
        email: data.email,
        password: data.password,
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/dashboard";
          },
          onError: (ctx) => {
            const msg = ctx.error?.message ?? "";
            if (
              msg.toLowerCase().includes("email not verified") ||
              msg.toLowerCase().includes("email_not_verified")
            ) {
              setUnverifiedEmail(data.email);
            } else {
              setFormError(msg || "Incorrect password. Please try again.");
            }
          },
        },
      });
    } catch {
      setFormError("Something went wrong. Please try again.");
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await sendVerificationEmail({ email: unverifiedEmail, callbackURL: "/dashboard" });
      toast.success("Verification email sent! Please check your inbox.");
    } catch {
      setFormError("Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-2 font-ce-display text-[32px] font-bold leading-tight tracking-tighter text-ce-text">
        Welcome back
      </h1>
      <p className="mb-7 text-[15px] text-ce-muted">
        Sign in to your <span className="font-semibold text-ce-text">CastEasy</span> account
      </p>

      {unverifiedEmail && (
        <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="mb-1.5 text-[13px] font-semibold text-amber-300">Email not verified</p>
              <p className="mb-2.5 text-xs leading-relaxed text-amber-200/80">
                Please verify your email address before signing in. Check your inbox for a
                verification link.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="rounded-lg border border-amber-500/50 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-60"
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
                <button
                  type="button"
                  onClick={() => setUnverifiedEmail(null)}
                  className="text-xs text-ce-muted3 transition hover:text-ce-text4"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

        <div className="mt-5">
          <label htmlFor="password" className={LABEL}>
            PASSWORD
          </label>
          <PasswordField
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            hasError={!!errors.password}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError msg={errors.password?.message} />
        </div>

        <div className="mb-5 mt-3 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[13px] font-semibold text-ce-accent transition hover:text-ce-accentLight"
          >
            Forgot password?
          </Link>
        </div>

        {formError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-3">
            <AlertCircle size={18} className="mt-px shrink-0 text-red-400" />
            <p className="text-[13px] text-red-300">{formError}</p>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={PRIMARY} style={GLOW}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <OrDivider />
      <GoogleButton
        onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
      />

      <p className="mt-6 text-center text-sm text-ce-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-ce-accent hover:text-ce-accentLight">
          Create one free
        </Link>
      </p>
    </AuthShell>
  );
}
