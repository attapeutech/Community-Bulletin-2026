"use client";

import { useState } from "react";
import Link from "next/link";

/** Pay link: straight to Stripe, no sign-in */
export default function PayButton({ token, price, email }: { token: string; price: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/pay/${token}`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error ?? "Couldn't start the payment");
      window.location.href = json.data.url;
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="text-[13px] text-[#4A6B82]">No sign-in needed. Your receipt goes to <b className="text-[#1A3A5C]">{email}</b>.</div>
      {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-[13px]">{error}</div>}
      <button type="button" onClick={pay} disabled={busy} className="h-11 rounded-md bg-[#E8563A] text-white text-[15px] font-semibold disabled:opacity-60">
        {busy ? "One moment…" : `Pay ${price}`}
      </button>
      <div className="text-[12px] text-[#4A6B82] text-center">
        Secure payment by Stripe on the next page. Card, Apple Pay or Google Pay. By paying you agree to our{" "}
        <Link href="/terms" target="_blank" className="text-[#4A90C4]">Terms</Link>.
      </div>
    </div>
  );
}
