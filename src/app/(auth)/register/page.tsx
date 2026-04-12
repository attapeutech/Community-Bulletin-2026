"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signIn, signUp } from "@/lib/auth/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
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
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    border: "1px solid #D1DDE8",
    background: "#F7F9FC",
    color: "#1A3A5C",
    fontSize: 14,
  };

  const labelStyle = {
    fontSize: 11,
    color: "#4A5568",
    letterSpacing: "0.04em",
  };

  return (
    <AuthLayout>
      <h1 className="font-serif font-bold mb-1" style={{ fontSize: 21, color: "#1A3A5C" }}>
        Create your account
      </h1>
      <p className="mb-6" style={{ fontSize: 13, color: "#6B8FA8" }}>
        Start advertising in your community today.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full name */}
        <div>
          <label className="block mb-1 font-semibold uppercase tracking-wider" style={labelStyle}>
            Full name
          </label>
          <input
            type="text"
            required
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full h-10 rounded-lg px-3 outline-none"
            style={inputStyle}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 font-semibold uppercase tracking-wider" style={labelStyle}>
            Email address
          </label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full h-10 rounded-lg px-3 outline-none"
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 font-semibold uppercase tracking-wider" style={labelStyle}>
            Password
          </label>
          <input
            type="password"
            required
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className="w-full h-10 rounded-lg px-3 outline-none"
            style={inputStyle}
          />
        </div>

        {/* Confirm password */}
        <div>
          <label className="block mb-1 font-semibold uppercase tracking-wider" style={labelStyle}>
            Confirm password
          </label>
          <input
            type="password"
            required
            placeholder="Re-enter password"
            value={form.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            className="w-full h-10 rounded-lg px-3 outline-none"
            style={inputStyle}
          />
        </div>

        <p style={{ fontSize: 11, color: "#9DC4E0" }}>
          By creating an account you agree to our{" "}
          <Link href="/terms" style={{ color: "#4A90C4" }}>Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: "#4A90C4" }}>Privacy Policy</Link>.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg font-semibold text-white transition-colors disabled:opacity-60"
          style={{ background: "#1A3A5C", fontSize: 14 }}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <hr className="flex-1" style={{ borderColor: "#E8EDF2" }} />
        <span style={{ fontSize: 12, color: "#A8BFD0" }}>or</span>
        <hr className="flex-1" style={{ borderColor: "#E8EDF2" }} />
      </div>

      {/* Google */}
      <button
        onClick={() => signIn.social?.({ provider: "google", callbackURL: "/dashboard" })}
        className="w-full h-10 rounded-lg flex items-center justify-center gap-2 font-medium"
        style={{ background: "#fff", border: "1px solid #D1DDE8", fontSize: 13, color: "#3D5068" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center mt-5" style={{ fontSize: 13, color: "#6B8FA8" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#E8563A", fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
