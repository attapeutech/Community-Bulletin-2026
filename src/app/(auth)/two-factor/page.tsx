"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{msg}</AlertDescription>
    </Alert>
  );
}

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    sendCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode() {
    setResending(true);
    try {
      await fetch("/api/auth/2fa/send", { method: "POST" });
      setSent(true);
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) { setFormError("Please enter the 6-digit code."); return; }
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Invalid code. Please try again.");
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="#4A90C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="font-serif font-bold text-[21px] text-primary m-0 mb-2">
          Check your email
        </h1>
        <p className="text-[13px] text-muted-foreground leading-relaxed m-0">
          {sent
            ? "We sent a 6-digit verification code to your email address."
            : "Sending your verification code…"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label className="block mb-1.5 text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.04em]">
            Verification code
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
            autoComplete="one-time-code"
            className="h-[52px] text-[26px] text-center font-mono tracking-[0.4em]"
          />
        </div>

        <FormError msg={formError} />

        <Button
          type="submit"
          disabled={loading || !sent}
          className="w-full h-11"
        >
          {loading ? "Verifying…" : "Verify"}
        </Button>
      </form>

      <p className="text-center mt-5 text-[13px] text-muted-foreground">
        Didn&apos;t receive it?{" "}
        <Button
          type="button"
          variant="link"
          onClick={sendCode}
          disabled={resending}
          className="text-accent font-semibold text-[13px] p-0 h-auto"
        >
          {resending ? "Sending…" : "Resend code"}
        </Button>
      </p>
    </AuthLayout>
  );
}
