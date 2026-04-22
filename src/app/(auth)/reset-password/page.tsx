"use client";

import { useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { resetPassword } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setFormError(null);
    if (!token) {
      setFormError("Invalid or expired reset link. Please request a new one.");
      return;
    }
    try {
      const result = await resetPassword({ newPassword: data.password, token });
      if (result.error) {
        setFormError(result.error.message ?? "Reset link is invalid or has expired.");
        return;
      }
      setDone(true);
    } catch {
      setFormError("Reset link is invalid or has expired. Please request a new one.");
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="font-serif font-bold text-[21px] text-primary m-0 mb-2">
          Password updated!
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0 mb-6">
          Your password has been reset successfully.
        </p>
        <Button onClick={() => router.push("/login")} className="w-full h-11">
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-serif font-bold text-[21px] text-primary m-0 mb-1">
        Set new password
      </h1>
      <p className="text-[13px] text-muted-foreground mt-0 mb-6">
        Choose a strong password for your account.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label className="block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]">
            New password
          </Label>
          <Input type="password" placeholder="Min. 8 characters" {...register("password")} className={errors.password ? "border-destructive bg-destructive/5" : ""} />
          <FieldError msg={errors.password?.message} />
        </div>
        <div>
          <Label className="block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]">
            Confirm password
          </Label>
          <Input type="password" placeholder="Re-enter password" {...register("confirm")} className={errors.confirm ? "border-destructive bg-destructive/5" : ""} />
          <FieldError msg={errors.confirm?.message} />
        </div>

        <FormError msg={formError} />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11"
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
      <p className="text-center mt-5 text-[13px] text-muted-foreground">
        <Link href="/login" className="text-destructive font-semibold no-underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
