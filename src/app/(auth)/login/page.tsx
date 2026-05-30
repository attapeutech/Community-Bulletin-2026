"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signIn, sendVerificationEmail, useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{msg}</AlertDescription>
    </Alert>
  );
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  if (session) { router.replace("/dashboard"); return null; }
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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

      const result = await signIn.email({ email: data.email, password: data.password, callbackURL: "/dashboard" });
      if (result.error) {
        const msg = result.error.message ?? "";
        if (msg.toLowerCase().includes("email not verified") || msg.toLowerCase().includes("email_not_verified")) {
          setUnverifiedEmail(data.email);
          return;
        }
        setFormError(msg || "Incorrect password. Please try again.");
        return;
      }
      router.push("/dashboard");
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
    <AuthLayout>
      <h1 className="font-serif font-bold text-[21px] text-primary m-0 mb-1">
        Welcome back
      </h1>
      <p className="text-[13px] text-muted-foreground mt-0 mb-5">
        Sign in to your CommunityBulletin account
      </p>

      {unverifiedEmail && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3 mb-5">
          <div className="flex items-start gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="flex-1">
              <p className="m-0 mb-1.5 text-[13px] font-semibold text-amber-800">
                Email not verified
              </p>
              <p className="m-0 mb-2.5 text-xs text-amber-800 leading-relaxed">
                Please verify your email address before signing in. Check your inbox for a verification link.
              </p>
              <div className="flex gap-2 items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs font-semibold text-amber-800 border-amber-500 bg-transparent hover:bg-amber-100 hover:text-amber-900 h-auto px-2.5 py-1"
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUnverifiedEmail(null)}
                  className="text-xs text-muted-foreground h-auto px-0 py-1 hover:bg-transparent hover:text-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col">
        <div className="mb-4">
          <Label className="block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]">
            Email address
          </Label>
          <Input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            className={errors.email ? "border-destructive bg-destructive/5" : ""}
          />
          <FieldError msg={errors.email?.message} />
        </div>

        <div className="mb-1">
          <Label className="block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]">
            Password
          </Label>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className={errors.password ? "border-destructive bg-destructive/5" : ""}
          />
          <FieldError msg={errors.password?.message} />
        </div>

        <div className="text-right mb-4 mt-2">
          <Link href="/forgot-password" className="text-xs text-accent no-underline">
            Forgot password?
          </Link>
        </div>

        <FormError msg={formError} />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
        className="w-full h-10 text-[13px] font-medium"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="text-center mt-5 text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-destructive font-semibold no-underline">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
}
