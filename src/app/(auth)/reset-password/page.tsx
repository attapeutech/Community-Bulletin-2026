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

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type FormData = z.infer<typeof schema>;

const label: React.CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
  color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em",
};
const primaryBtn: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 8, border: "none",
  background: "#1A3A5C", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const iconCircle = (bg: string): React.CSSProperties => ({
  width: 56, height: 56, borderRadius: "50%", background: bg,
  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
});

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ margin: "4px 0 0", fontSize: 12, color: "#b91c1c" }}>{msg}</p>;
}

function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "#FEF2F2", border: "1px solid #fca5a5", borderRadius: 8,
      padding: "10px 14px", marginBottom: 16,
      display: "flex", gap: 8, alignItems: "flex-start",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="10" stroke="#b91c1c" strokeWidth="1.5"/>
        <path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 13, color: "#b91c1c" }}>{msg}</span>
    </div>
  );
}

function inputStyle(err?: boolean): React.CSSProperties {
  return {
    width: "100%", height: 40, borderRadius: 8, padding: "0 12px",
    border: `1px solid ${err ? "#fca5a5" : "#D1DDE8"}`,
    background: err ? "#fff5f5" : "#F7F9FC",
    color: "#1A3A5C", fontSize: 14, outline: "none", boxSizing: "border-box",
  };
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
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={iconCircle("#EDFBF4")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
          Password updated!
        </h1>
        <p style={{ fontSize: 13, color: "#6B8FA8", margin: "0 0 24px" }}>
          Your password has been reset successfully.
        </p>
        <button onClick={() => router.push("/login")} style={primaryBtn}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 4px" }}>
        Set new password
      </h1>
      <p style={{ fontSize: 13, color: "#6B8FA8", margin: "0 0 24px" }}>
        Choose a strong password for your account.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={label}>New password</label>
          <input type="password" placeholder="Min. 8 characters" {...register("password")} style={inputStyle(!!errors.password)} />
          <FieldError msg={errors.password?.message} />
        </div>
        <div>
          <label style={label}>Confirm password</label>
          <input type="password" placeholder="Re-enter password" {...register("confirm")} style={inputStyle(!!errors.confirm)} />
          <FieldError msg={errors.confirm?.message} />
        </div>

        <FormError msg={formError} />

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...primaryBtn, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B8FA8" }}>
        <Link href="/login" style={{ color: "#E8563A", fontWeight: 600, textDecoration: "none" }}>
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div style={{ color: "#6B8FA8", fontSize: 14 }}>Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
