import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MapPin, Users } from "lucide-react";
import { loadPayLinkAd, payLinkBlocked, readPayLinkToken } from "@/lib/pay-links";
import { formatPrice } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";
import { recordPaidCheckout } from "@/lib/stripe-checkout";
import PayButton from "./PayButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pay for your ad", robots: { index: false, follow: false } };

// A pay link from the sales team: the advertiser pays for their own unpaid ad, no sign-in
export default async function PayLinkPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { token } = await params;
  const { session_id: checkoutId } = await searchParams;

  const read = readPayLinkToken(token);
  let ad = "error" in read ? null : await loadPayLinkAd(read.adId);
  if (!ad) {
    const expired = "error" in read && read.error === "expired";
    return (
      <Shell>
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 p-5 text-[15px]">
          {expired ? "This pay link has expired. Reply to the message and we'll send you a new one." : "This pay link isn't valid, or the ad is no longer available."}
        </div>
      </Shell>
    );
  }

  // Back from Stripe: record the payment now in case the webhook is late
  if (checkoutId && ad.paymentStatus === "unpaid") {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(checkoutId);
      const done = await recordPaidCheckout(checkout, ad.id, ad.userId);
      if (done.ok) ad = (await loadPayLinkAd(ad.id)) ?? ad;
    } catch (err) {
      console.error("[pay link page] confirming checkout failed", err);
    }
  }

  const paid = ad.paymentStatus === "paid";
  const blocked = paid ? null : payLinkBlocked(ad);
  const price = formatPrice(ad.price);

  return (
    <Shell>
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E8563A] mb-2">Your ad</div>
      <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#1A3A5C] leading-tight mb-6">{ad.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-[#071520] rounded-xl p-1.5 shadow-lg">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#0A1A2E]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.imageUrl} alt={ad.title} className="absolute inset-0 w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#1A3A5C]">
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-[#E8563A]" /> {ad.storeName} · {ad.storeAddress}, {ad.city}, {ad.state}</span>
            {ad.shoppers && <span className="inline-flex items-center gap-1.5"><Users size={15} className="text-[#E8563A]" /> about {ad.shoppers.toLocaleString("en-US")} shoppers a day</span>}
          </div>
        </div>

        <div className="rounded-xl border border-[#D8E4EE] bg-white p-5 sm:p-6 text-[#1A3A5C]">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-[34px] font-bold">{price}</span>
            <span className="text-[#4A6B82] text-[14px]">for 4 weeks</span>
          </div>
          <ul className="text-[13px] text-[#4A6B82] mb-5 flex flex-col gap-1 list-none p-0 m-0">
            <li>✓ Shown all day, every day, on the store&apos;s screen</li>
            <li>✓ Goes live as soon as it&apos;s approved</li>
            <li>✓ Full refund if it isn&apos;t approved</li>
          </ul>

          {paid ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 p-4 text-[14px] flex gap-2">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <div>Thank you, it&apos;s paid! We&apos;ll review your ad and email <b>{ad.userEmail}</b> when it&apos;s live on the {ad.storeName} screen.</div>
              </div>
              <Link href="/login?callbackUrl=%2Fdashboard%2Fuser" className="text-[14px] font-semibold text-[#4A90C4] no-underline hover:underline">See it in My Ads →</Link>
            </div>
          ) : blocked ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-4 text-[14px]">{blocked}</div>
          ) : (
            <PayButton token={token} price={price} email={ad.userEmail} />
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</div>;
}
