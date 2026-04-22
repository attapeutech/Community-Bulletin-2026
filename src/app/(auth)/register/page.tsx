"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signIn, signUp } from "@/lib/auth/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type FormData = z.infer<typeof schema>;

const s = {
  label: {
    display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
    color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.04em",
  },
  input: (err?: boolean): React.CSSProperties => ({
    width: "100%", height: 40, borderRadius: 8, padding: "0 12px",
    border: `1px solid ${err ? "#fca5a5" : "#D1DDE8"}`,
    background: err ? "#fff5f5" : "#F7F9FC",
    color: "#1A3A5C", fontSize: 14, outline: "none", boxSizing: "border-box",
  }),
  field: { marginBottom: 16 },
  primaryBtn: {
    width: "100%", height: 44, borderRadius: 8, border: "none",
    background: "#1A3A5C", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4,
  },
  dividerRow: { display: "flex", alignItems: "center", gap: 12, margin: "16px 0" },
  dividerLine: { flex: 1, height: 1, background: "#E8EDF2", border: "none" },
  googleBtn: {
    width: "100%", height: 40, borderRadius: 8, border: "1px solid #D1DDE8",
    background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, fontSize: 13, fontWeight: 500, color: "#3D5068", cursor: "pointer",
  },
} as const;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ margin: "4px 0 0", fontSize: 12, color: "#b91c1c" }}>{msg}</p>;
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const check = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const { exists } = await check.json();
      if (exists) {
        toast.error("An account with this email already exists. Please sign in instead.");
        return;
      }

      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
      });
      if (result.error) {
        toast.error(result.error.message ?? "Registration failed.");
        return;
      }
      toast.success("Account created! Please check your email to verify your account.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <AuthLayout>
      <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21, color: "#1A3A5C", margin: "0 0 4px" }}>
        Create your account
      </h1>
      <p style={{ fontSize: 13, color: "#6B8FA8", margin: "0 0 24px" }}>
        Start advertising in your community today.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column" }}>
        <div style={s.field}>
          <label style={s.label}>Full name</label>
          <input type="text" placeholder="Jane Smith" {...register("name")} style={s.input(!!errors.name)} />
          <FieldError msg={errors.name?.message} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Email address</label>
          <input type="email" placeholder="you@example.com" {...register("email")} style={s.input(!!errors.email)} />
          <FieldError msg={errors.email?.message} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input type="password" placeholder="Min. 8 characters" {...register("password")} style={s.input(!!errors.password)} />
          <FieldError msg={errors.password?.message} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Confirm password</label>
          <input type="password" placeholder="Re-enter password" {...register("confirm")} style={s.input(!!errors.confirm)} />
          <FieldError msg={errors.confirm?.message} />
        </div>

        <p style={{ fontSize: 11, color: "#9DC4E0", margin: "0 0 16px" }}>
          By creating an account you agree to our{" "}
          <Link href="/terms" style={{ color: "#4A90C4", textDecoration: "none" }}>Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: "#4A90C4", textDecoration: "none" }}>Privacy Policy</Link>.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...s.primaryBtn, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div style={s.dividerRow}>
        <hr style={s.dividerLine} />
        <span style={{ fontSize: 12, color: "#A8BFD0" }}>or</span>
        <hr style={s.dividerLine} />
      </div>

      <button
        onClick={() => signIn.social?.({ provider: "google", callbackURL: "/dashboard" })}
        style={s.googleBtn}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B8FA8" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#E8563A", fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
