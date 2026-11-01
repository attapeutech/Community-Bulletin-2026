"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MapPin, Users } from "lucide-react";
import { signIn } from "@/lib/auth/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCAL_AD_RADIUS_MILES } from "@/types";

const fieldLabel = "block mb-1.5 text-[11px] font-semibold text-[#4A6B82] uppercase tracking-[0.04em]";

export default function ProposalClient({ token, businessName, store, price, previewSrc, blocked, paid, email, defaults, signedIn, accountExists }: {
  token: string;
  businessName: string;
  store: { name: string; place: string; shoppers: number | null };
  price: string;
  previewSrc: string | null;
  blocked: string | null;
  paid: boolean;
  email: string;
  defaults: { name: string; phone: string };
  signedIn: { name: string; email: string } | null;
  accountExists: boolean;
}) {
  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(defaults.phone);
  const [password, setPassword] = useState("");
  const [local, setLocal] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const callback = `/p/${token}`;

  // Copy the ad into their account, then the usual payment page
  async function accept() {
    const res = await fetch(`/api/proposals/${token}/accept`, { method: "POST" });
    const json = await res.json().catch(() => null);
    if (!json?.success) throw new Error(json?.error ?? "Couldn't accept the proposal");
    window.location.href = `/ads/${json.data.adId}/payment`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!local || !terms) { setError("Please tick both boxes to continue."); return; }
    setBusy(true);
    setError("");
    try {
      if (!signedIn) {
        const res = await fetch(`/api/proposals/${token}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, password }),
        });
        const json = await res.json().catch(() => null);
        if (!json?.success) throw new Error(json?.error ?? "Couldn't create your account");
        const signed = await signIn.email({ email, password });
        if (signed?.error) throw new Error(signed.error.message ?? "Your account was created, but signing in failed. Use Sign in with your new password.");
      }
      await accept();
    } catch (err: any) {
      setError(err.message);
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
            <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 p-4 text-[14px] flex gap-2">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>Thank you! Your ad is live. <Link href="/dashboard/user" className="font-semibold text-green-800">See it in My Ads →</Link></div>
            </div>
          ) : blocked ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-4 text-[14px]">{blocked}</div>
          ) : !signedIn && accountExists ? (
            <div className="flex flex-col gap-3">
              <div className="text-[14px]">You already have a Community Bulletin account with <b>{email}</b>. Sign in to accept.</div>
              <Link href={`/login?callbackUrl=${encodeURIComponent(callback)}`} className="inline-flex justify-center items-center h-11 rounded-md bg-[#E8563A] text-white text-[15px] font-semibold no-underline">
                Sign in to accept
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3.5">
              {signedIn ? (
                <div className="text-[13px] text-[#4A6B82]">Signed in as <b className="text-[#1A3A5C]">{signedIn.email}</b></div>
              ) : (
                <>
                  <div className="text-[13px] text-[#4A6B82]">Create your free account to accept. You&apos;ll use it to see your ad and renew it.</div>
                  <div>
                    <Label className={fieldLabel}>Email</Label>
                    <Input value={email} readOnly className="h-10 bg-[#F4F7FB]" />
                  </div>
                  <div>
                    <Label className={fieldLabel}>Your name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" className="h-10 bg-white" />
                  </div>
                  <div>
                    <Label className={fieldLabel}>Phone</Label>
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" className="h-10 bg-white" />
                  </div>
                  <div>
                    <Label className={fieldLabel}>Choose a password</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="h-10 bg-white" />
                  </div>
                </>
              )}
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
                {busy ? "One moment…" : `Accept & pay ${price}`}
              </button>
              <div className="text-[12px] text-[#4A6B82] text-center">Secure card payment by Stripe on the next page.</div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
