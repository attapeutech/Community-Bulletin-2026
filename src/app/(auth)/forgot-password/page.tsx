"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
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

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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

  return (
    <AuthLayout>
      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-serif font-bold text-[21px] text-primary m-0 mb-2">
            Check your email
          </h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed mt-0 mb-5">
            We sent a password reset link to <strong className="text-primary">{emailValue}</strong>.{" "}
            The link expires in 1 hour.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it?{" "}
            <Link href="/forgot-password" className="text-accent font-semibold no-underline">
              Try again
            </Link>
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-serif font-bold text-[21px] text-primary m-0 mb-1">
            Forgot your password?
          </h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed mt-0 mb-6">
            Enter the email address for your account and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
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

            <FormError msg={formError} />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11"
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <p className="text-center mt-5 text-[13px] text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="text-destructive font-semibold no-underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
