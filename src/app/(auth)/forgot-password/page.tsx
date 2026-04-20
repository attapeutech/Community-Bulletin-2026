"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgetPassword } from "@/lib/auth/client";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
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

export default function ForgotPasswordPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const emailValue = watch("email", "");

  async function onSubmit(data: FormData) {
    try {
      await forgetPassword({ email: data.email, redirectTo: "/reset-password" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <AuthLayout>
      {isSubmitSuccessful ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={iconCircle("#EEF6FF")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 8px" }}>
            Check your email
          </h1>
          <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6, margin: "0 0 20px" }}>
            We sent a password reset link to <strong style={{ color: "#1A3A5C" }}>{emailValue}</strong>.{" "}
            The link expires in 1 hour.
          </p>
          <p style={{ fontSize: 12, color: "#9DC4E0" }}>
            Didn&apos;t receive it?{" "}
            <Link href="/forgot-password" style={{ color: "#4A90C4", fontWeight: 600, textDecoration: "none" }}>
              Try again
            </Link>
          </p>
        </div>
      ) : (
        <>
          <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 4px" }}>
            Forgot your password?
          </h1>
          <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6, margin: "0 0 24px" }}>
            Enter the email address for your account and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={label}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                style={{
                  width: "100%", height: 40, borderRadius: 8, padding: "0 12px",
                  border: `1px solid ${errors.email ? "#fca5a5" : "#D1DDE8"}`,
                  background: errors.email ? "#fff5f5" : "#F7F9FC",
                  color: "#1A3A5C", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
              <FieldError msg={errors.email?.message} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ ...primaryBtn, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B8FA8" }}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "#E8563A", fontWeight: 600, textDecoration: "none" }}>
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
