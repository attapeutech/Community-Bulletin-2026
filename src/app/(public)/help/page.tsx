"use client";

import React, { useState } from "react";
import { paypalEnabled } from "@/lib/payment-options";
import Link from "next/link";
import {
  HelpCircle, BookOpen, CreditCard, Store,
  Wrench, ChevronDown, ArrowRight, MessageSquare,
} from "lucide-react";

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    icon: BookOpen,
    label: "Getting Started",
    color: "#4A90C4",
    faqs: [
      { q: "How do I create an account?", a: <>Click <Link href="/register" className="text-[#4A90C4] font-medium hover:underline">Get started free</Link> on the home page, fill in your name, email and password, then verify your email. You'll be ready to post ads within minutes. Own a store? Tick &ldquo;I own or manage a store&rdquo; to also apply as a store partner.</> },
      { q: "How do I post my first ad?", a: <>After logging in, go to <Link href="https://communitybulletin.com/dashboard/user" className="text-[#4A90C4] font-medium hover:underline">My Ads</Link> in your dashboard and click 'Post a New Ad'. Upload your image, choose a store location, select your run dates, and complete the payment at that store's weekly price. Your ad will be reviewed within 24 hours.</> },
      { q: "What image formats are accepted?", a: "We accept JPEG, PNG, WebP, and GIF files up to 10 MB. For best display quality we recommend a 1920×1080 (16:9) or 1080×1920 (9:16) image at 72–150 DPI." },
      { q: "How long does a campaign run?", a: "Each campaign runs for 1 week (7 days) from the approved start date. You can post multiple campaigns to extend your reach." },
    ],
  },
  {
    icon: CreditCard,
    label: "Billing & Payments",
    color: "#E8563A",
    faqs: [
      { q: "How much does it cost?", a: "Each store has its own weekly price, shown in the location search and again before you pay. No hidden fees, no setup costs, no contracts." },
      { q: "What payment methods are accepted?", a: `We accept all major credit and debit cards via Stripe.${paypalEnabled() ? " PayPal is also supported at checkout." : ""}` },
      { q: "Can I get a refund?", a: "Yes. If your ad is denied after review you will receive a full refund automatically. Approved ads that are cancelled before the run date are also eligible for a refund — contact support for details." },
      { q: "When is my card charged?", a: "Your card is charged at the time of submission, before review. If the ad is denied, the charge is reversed within 3–5 business days." },
    ],
  },
  {
    icon: HelpCircle,
    label: "Ad Management",
    color: "#10B981",
    faqs: [
      { q: "How long does approval take?", a: "Most ads are reviewed within 24 hours (often faster). You'll receive an email notification as soon as a decision is made." },
      { q: "Why was my ad denied?", a: "Ads are denied when they don't meet our content guidelines — e.g. prohibited content, low resolution images, or misleading claims. The denial email will include a specific reason, and you're welcome to revise and resubmit." },
      { q: "Can I edit my ad after submitting?", a: "Ads cannot be edited once submitted for review. If you need to make changes, contact support to cancel the current submission (and receive a refund), then resubmit." },
      { q: "Can I run the same ad at multiple locations?", a: "Yes! Submit a separate campaign for each store location you'd like to target. Each location is billed independently at its own weekly price." },
    ],
  },
  {
    icon: Store,
    label: "For Store Owners",
    color: "#8B5CF6",
    faqs: [
      { q: "How do I become a store partner?", a: <>When you <Link href="/register" className="text-[#4A90C4] font-medium hover:underline">create your account</Link>, tick <strong>&ldquo;I own or manage a store&rdquo;</strong> and add your store details. Already have an account? Use <Link href="/partners/apply" className="text-[#4A90C4] font-medium hover:underline">Become a Store Partner</Link>. We review every store, then email you once you&apos;re approved and contact you to set up your screen. You can see your application status on your dashboard.</> },
      { q: "Do I need to buy any equipment?", a: "No. There are no fees. Use a TV and WiFi you already have plus an inexpensive streaming device, or we provide and install the screen at no cost to you. Setup takes about an hour." },
      { q: "How much will I earn?", a: "You earn a share of every ad shown at your store: the percentage agreed for your location (typically 50% if you provide the screen, or 25% if we do), calculated on the ad price after card processing fees. Your Earnings page shows every ad and what you've earned." },
      { q: "When and how do I get paid?", a: <>Earnings from an ad become available once its weekly run ends, and are paid out monthly; balances under $25 roll over to the next month. Add your payout details (Zelle or mailed check) on your <Link href="/dashboard/store-owner/earnings" className="text-[#4A90C4] font-medium hover:underline">Earnings page</Link>. Payouts start once your store partner agreement is signed. Direct deposit is coming soon.</> },
      { q: "Do I need to sign an agreement?", a: "Yes. After you're approved we'll send a store partner agreement covering the screen space, your revenue share and payouts. Payouts begin once it's signed." },
      { q: "How does the display screen work?", a: "Once your location is set up, open the Display Screen URL on any TV or screen browser at your store. Approved ads for your location rotate automatically — no app install required. If the internet drops briefly, the screen keeps showing ads and reconnects on its own." },
      { q: "What screen sizes are supported?", a: "The display works on any screen that runs a modern browser: TVs, tablets, monitors and phones, in landscape or portrait. It scales to fit. On an iPhone or iPad, tap Share → Add to Home Screen and open it from the icon for full screen." },
      { q: "Can I choose which ads display at my store?", a: "Every ad is reviewed by our team before it appears, and prohibited content is never shown. If you have concerns about a specific ad, or want competitors excluded, contact us and we'll take care of it." },
    ],
  },
  {
    icon: Wrench,
    label: "Technical",
    color: "#F59E0B",
    faqs: [
      { q: "What browsers are supported?", a: "We support all modern browsers: Chrome, Firefox, Safari, and Edge. For the best experience keep your browser up to date." },
      { q: "How do I reset my password?", a: "Click 'Forgot password?' on the Sign In page, enter your email address, and we'll send you a reset link. The link expires after 1 hour." },
      { q: "I'm not receiving emails. What should I check?", a: "Check your spam or junk folder first. Add noreply@communitybulletin.com to your contacts. If the issue persists, contact support with your account email." },
      { q: "Who do I contact for urgent technical issues?", a: "Use the contact form below and select 'Technical Issue' as the subject. For critical outages you can also email support@communitybulletin.com directly." },
    ],
  },
];

// ─── Accordion item ────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E8EFF6] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
      >
        <span className="text-[14px] font-semibold text-[#1A3A5C] group-hover:text-[#4A90C4] transition-colors leading-snug">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 mt-0.5 text-[#4A6B82] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-[13px] text-[#4A5568] leading-relaxed pb-4 pr-8">{a}</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-14 pb-14 px-4 sm:px-8 bg-gradient-to-br from-[#1A3A5C] via-[#0F2540] to-[#1A3A5C] text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
          <HelpCircle size={14} className="text-[#9DC4E0]" />
          <span className="text-xs font-semibold text-[#9DC4E0] uppercase tracking-wide">Help & Support</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-white mb-4">How can we help you?</h1>
        <p className="text-[#9DC4E0] text-base max-w-xl mx-auto leading-relaxed">
          Browse our FAQ or send us a message. We typically respond within 1–2 business days.
        </p>
      </section>

      {/* ── Quick-access cards ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 -mt-6 mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {FAQ_CATEGORIES.map((cat, i) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(i)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${activeCategory === i ? "bg-white border-[#4A90C4] shadow-md" : "bg-white border-[#E2EAF2] hover:border-[#4A90C4] hover:shadow-sm"}`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${cat.color}18` }}>
                  <CatIcon size={18} style={{ color: cat.color }} />
                </div>
                <span className="text-[12px] font-semibold text-[#1A3A5C] leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 mb-16">
        <div className="bg-white rounded-2xl border border-[#E2EAF2] shadow-sm overflow-hidden">
          {/* Category header */}
          <div className="px-6 py-5 border-b border-[#E8EFF6] flex items-center gap-3">
            {(() => { const CatIcon = FAQ_CATEGORIES[activeCategory].icon; return <CatIcon size={20} style={{ color: FAQ_CATEGORIES[activeCategory].color }} />; })()}
            <h2 className="font-serif font-bold text-lg text-[#1A3A5C]">{FAQ_CATEGORIES[activeCategory].label}</h2>
            <span className="ml-auto text-xs text-[#4A6B82]">{FAQ_CATEGORIES[activeCategory].faqs.length} questions</span>
          </div>
          <div className="px-6 divide-y divide-[#E8EFF6]">
            {FAQ_CATEGORIES[activeCategory].faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Still need help CTA ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 mb-20">
        <div className="bg-white rounded-2xl border border-[#E2EAF2] shadow-sm p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-14 h-14 rounded-full bg-[#4A90C4]/10 flex items-center justify-center shrink-0">
            <MessageSquare size={24} className="text-[#4A90C4]" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif font-bold text-lg text-[#1A3A5C] mb-1">Still need help?</h2>
            <p className="text-sm text-[#4A6B82]">Can't find the answer you're looking for? Send us a message and we'll get back to you within 1–2 business days.</p>
          </div>
          <Link
            href="/contact"
            className="no-underline shrink-0 inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#1A3A5C] hover:bg-[#0F2540] text-white text-sm font-semibold transition-colors"
          >
            Contact us
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
