"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
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
import { signIn, signUp, useSession } from "@/lib/auth/client";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Previously this redirect ran as an early `return null` placed above the
  // useState calls, so the hook order changed once a session appeared --
  // React throws "rendered fewer hooks than expected" on that transition.
  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      setFormError(null);
      setFormSuccess(null);

      if (!executeRecaptcha) {
        setFormError("reCAPTCHA not ready. Please try again.");
        return;
      }

      try {
        const token = await executeRecaptcha("register");
        const captchaRes = await fetch("/api/auth/verify-recaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const { success: captchaOk } = await captchaRes.json();
        if (!captchaOk) {
          setFormError("reCAPTCHA verification failed. Please try again.");
          return;
        }

        const check = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        const { exists } = await check.json();
        if (exists) {
          setFormError("An account with this email already exists. Please sign in instead.");
          return;
        }

        const result = await signUp.email({
          name: data.name,
          email: data.email,
          password: data.password,
          callbackURL: "/dashboard",
        });
        if (result.error) {
          setFormError(result.error.message ?? "Registration failed. Please try again.");
          return;
        }
        setFormSuccess("Account created! Please check your email to verify your account.");
        toast.success("Account created! Please check your email to verify your account.");
      } catch {
        setFormError("Something went wrong. Please try again.");
      }
    },
    [executeRecaptcha]
  );

  return (
    <AuthShell>
      <h1 className="mb-2 font-ce-display text-[32px] font-bold leading-tight tracking-tighter text-ce-text">
        Create your account
      </h1>
      <p className="mb-7 text-[15px] text-ce-muted">Start advertising in your community today.</p>

      {formSuccess && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-ce-accent/40 bg-ce-accent/10 px-3.5 py-3">
          <CheckCircle2 size={18} className="mt-px shrink-0 text-ce-accent" />
          <p className="text-[13px] text-ce-accentLight">{formSuccess}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="name" className={LABEL}>
          FULL NAME
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          aria-invalid={!!errors.name}
          className={`${FIELD} ${errors.name ? FIELD_ERROR : ""}`}
          {...register("name")}
        />
        <FieldError msg={errors.name?.message} />

        <div className="mt-5">
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
        </div>

        <div className="mt-5">
          <label htmlFor="password" className={LABEL}>
            PASSWORD
          </label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hasError={!!errors.password}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError msg={errors.password?.message} />
        </div>

        <div className="mb-6 mt-5">
          <label htmlFor="confirm" className={LABEL}>
            CONFIRM PASSWORD
          </label>
          <PasswordField
            id="confirm"
            autoComplete="new-password"
            placeholder="••••••••"
            hasError={!!errors.confirm}
            aria-invalid={!!errors.confirm}
            {...register("confirm")}
          />
          <FieldError msg={errors.confirm?.message} />
        </div>

        {formError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-3">
            <AlertCircle size={18} className="mt-px shrink-0 text-red-400" />
            <p className="text-[13px] text-red-300">{formError}</p>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={PRIMARY} style={GLOW}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <OrDivider />
      <GoogleButton
        onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
      />

      <p className="mt-6 text-center text-sm text-ce-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-ce-accent hover:text-ce-accentLight">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
      <RegisterForm />
    </GoogleReCaptchaProvider>
  );
}
