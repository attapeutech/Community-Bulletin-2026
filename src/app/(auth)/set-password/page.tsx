"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
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

// Shown after logging in with an admin-issued temporary password
export default function SetPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setFormError(null);
    try {
      const res = await fetch("/api/user/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: data.password }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) {
        setFormError(json?.error ?? "Could not save your password. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Could not save your password. Please try again.");
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <AuthLayout>
      <h1 className="font-serif font-bold text-[21px] text-primary m-0 mb-1">
        Choose your password
      </h1>
      <p className="text-[13px] text-muted-foreground mt-0 mb-6">
        You signed in with a temporary password. Pick your own to continue — at least 8 characters.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label className="block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]">
            New password
          </Label>
          <PasswordInput placeholder="Min. 8 characters" {...register("password")} className={errors.password ? "border-destructive bg-destructive/5" : ""} />
          <FieldError msg={errors.password?.message} />
        </div>
        <div>
          <Label className="block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]">
            Confirm password
          </Label>
          <PasswordInput placeholder="Re-enter password" {...register("confirm")} className={errors.confirm ? "border-destructive bg-destructive/5" : ""} />
          <FieldError msg={errors.confirm?.message} />
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full h-11">
          {isSubmitting ? "Saving…" : "Save password and continue"}
        </Button>
      </form>
      <p className="text-center mt-5 text-[13px] text-muted-foreground">
        <button type="button" onClick={handleSignOut} className="text-destructive font-semibold bg-transparent border-0 cursor-pointer">
          Sign out
        </button>
      </p>
    </AuthLayout>
  );
}
