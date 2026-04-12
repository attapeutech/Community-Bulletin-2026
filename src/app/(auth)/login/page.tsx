"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signIn } from "@/lib/auth/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        toast.error(result.error.message ?? "Invalid email or password.");
        return;
      }

      // If 2FA is required, better-auth redirects to /two-factor automatically
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <AuthLayout>
      <h1
        className="font-serif font-bold mb-1"
        style={{ fontSize: 21, color: "#1A3A5C" }}
      >
        Welcome back
      </h1>
      <p className="mb-5" style={{ fontSize: 13, color: "#6B8FA8" }}>
        Sign in to your CommunityBulletin account
      </p>

      {/* 2FA notice */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 mb-5"
        style={{ background: "#EEF6FF", border: "1px solid #BED8F0", fontSize: 12, color: "#2A6096" }}
      >
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: 8, height: 8, background: "#4A90C4", display: "inline-block" }}
        />
        Two-factor authentication is enabled for your security.
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-0">
        {/* Email */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold uppercase tracking-wider"
            style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.04em" }}
          >
            Email address
          </label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 rounded-lg px-3 text-sm outline-none transition-colors"
            style={{
              border: "1px solid #D1DDE8",
              background: "#F7F9FC",
              color: "#1A3A5C",
              fontSize: 14,
            }}
          />
        </div>

        {/* Password */}
        <div className="mb-1">
          <label
            className="block mb-1 font-semibold uppercase tracking-wider"
            style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.04em" }}
          >
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 rounded-lg px-3 outline-none transition-colors"
            style={{
              border: "1px solid #D1DDE8",
              background: "#F7F9FC",
              color: "#1A3A5C",
              fontSize: 14,
            }}
          />
        </div>

        {/* Forgot */}
        <div className="text-right mb-4 mt-1">
          <Link
            href="/forgot-password"
            style={{ fontSize: 12, color: "#4A90C4" }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg font-semibold text-white transition-colors disabled:opacity-60"
          style={{ background: "#1A3A5C", fontSize: 14 }}
        >
          {loading ? "Signing in…" : "Sign in"}
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
        onClick={handleGoogle}
        className="w-full h-10 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
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

      {/* Register */}
      <p className="text-center mt-5" style={{ fontSize: 13, color: "#6B8FA8" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#E8563A", fontWeight: 600 }}>
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
}
