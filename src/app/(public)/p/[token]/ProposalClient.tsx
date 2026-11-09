"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MapPin, Users } from "lucide-react";
import { LOCAL_AD_RADIUS_MILES } from "@/types";

export default function ProposalClient({ token, businessName, store, price, previewSrc, blocked, paid, email, signedIn, canSignIn }: {
  token: string;
  businessName: string;
  store: { name: string; place: string; shoppers: number | null };
  price: string;
  previewSrc: string | null;
  blocked: string | null;
  paid: boolean;
  email: string;
  signedIn: { name: string; email: string } | null;
  canSignIn: boolean;   // paid and not signed in: their account already has a password or Google sign-in
}) {
  const [local, setLocal] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  // No account or password needed: straight to Stripe
  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!local || !terms) { setError("Please tick both boxes to continue."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/proposals/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local, terms }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error ?? "Couldn't start the payment");
      window.location.href = json.data.url;
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  // After paying: the usual "reset password" email, which lets them choose their first password
  async function sendPasswordLink() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: "/reset-password" }),
      });
      if (!res.ok) throw new Error("Couldn't send the email. Try again in a moment.");
      setLinkSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E8563A] mb-2">Your ad proposal</div>
      <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#1A3A5C] leading-tight mb-2">{businessName} on the {store.name} screen</h1>
      <p className="text-[#4A6B82] text-[15px] mb-7 max-w-[680px]">
        Here&apos;s the ad we made for you, playing just as it will on the Community Bulletin screen inside {store.name}.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0A1A2E] shadow-lg">
            {previewSrc
              ? <iframe src={previewSrc} title={`${businessName} ad preview`} className="absolute inset-0 w-full h-full border-0" />
              : <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">Preview unavailable</div>}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#1A3A5C]">
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-[#E8563A]" /> {store.name} · {store.place}</span>
            {store.shoppers && <span className="inline-flex items-center gap-1.5"><Users size={15} className="text-[#E8563A]" /> about {store.shoppers.toLocaleString("en-US")} shoppers a day</span>}
          </div>
        </div>

        <div className="rounded-xl border border-[#D8E4EE] bg-white p-5 sm:p-6 text-[#1A3A5C]">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-[34px] font-bold">{price}</span>
            <span className="text-[#4A6B82] text-[14px]">for 4 weeks</span>
          </div>
          <ul className="text-[13px] text-[#4A6B82] mb-5 flex flex-col gap-1 list-none p-0 m-0">
            <li>✓ Starts as soon as you pay</li>
            <li>✓ Shown all day, every day, on the store&apos;s screen</li>
            <li>✓ Shoppers can scan the QR code to reach you</li>
          </ul>

          {paid ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 p-4 text-[14px] flex gap-2">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <div>Thank you! Your ad is live on the {store.name} screen.{!signedIn && <> Your receipt is on its way to <b>{email}</b>.</>}</div>
              </div>
              {signedIn ? (
                <Link href="/dashboard/user" className="text-[14px] font-semibold text-[#4A90C4] no-underline hover:underline">See it in My Ads →</Link>
              ) : canSignIn ? (
                <Link href="/login?callbackUrl=%2Fdashboard%2Fuser" className="text-[14px] font-semibold text-[#4A90C4] no-underline hover:underline">Sign in to see it in My Ads →</Link>
              ) : linkSent ? (
                <div className="text-[13px] text-[#4A6B82]">Check your email for a link to choose your password.</div>
              ) : (
                <div className="text-[13px] text-[#4A6B82]">
                  Want to see your ad or renew it later? You can choose a password any time.{" "}
                  <button type="button" disabled={busy} onClick={sendPasswordLink} className="font-semibold text-[#4A90C4] hover:underline disabled:opacity-60 p-0 bg-transparent border-0 cursor-pointer">
                    Email me a link to set one
                  </button>
                  {error && <div className="mt-2 text-red-700">{error}</div>}
                </div>
              )}
            </div>
          ) : blocked ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-4 text-[14px]">{blocked}</div>
          ) : (
            <form onSubmit={pay} className="flex flex-col gap-3.5">
              <div className="text-[13px] text-[#4A6B82]">No account or password needed. Your receipt goes to <b className="text-[#1A3A5C]">{signedIn?.email ?? email}</b>.</div>
              <label className="flex gap-2.5 items-start text-[13px] leading-snug cursor-pointer">
                <input type="checkbox" checked={local} onChange={e => setLocal(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 accent-[#1A3A5C]" />
                <span>My business is within about {LOCAL_AD_RADIUS_MILES} miles of {store.name}, or serves customers in its area.</span>
              </label>
              <label className="flex gap-2.5 items-start text-[13px] leading-snug cursor-pointer">
                <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 accent-[#1A3A5C]" />
                <span>I agree to the <Link href="/terms" target="_blank" className="text-[#4A90C4]">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-[#4A90C4]">Privacy Policy</Link>.</span>
              </label>
              {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-[13px]">{error}</div>}
              <button type="submit" disabled={busy} className="h-11 rounded-md bg-[#E8563A] text-white text-[15px] font-semibold disabled:opacity-60">
                {busy ? "One moment…" : `Pay ${price}`}
              </button>
              <div className="text-[12px] text-[#4A6B82] text-center">Secure payment by Stripe on the next page. Card, Apple Pay or Google Pay.</div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
