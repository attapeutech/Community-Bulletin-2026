"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { useState } from "react";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "For stores", href: "#stores" },
];

const FEATURES = [
  {
    icon: "📍",
    title: "Location-targeted ads",
    desc: "Choose exactly which store locations display your ad. Target by city, state, or specific address.",
  },
  {
    icon: "📺",
    title: "Beautiful display screens",
    desc: "Your ad displays on modern digital screens inside stores — responsive from mobile to large TV.",
  },
  {
    icon: "⚡",
    title: "Goes live instantly",
    desc: "Once approved, your ad pushes live to the display screen in real-time via Socket.io — no delays.",
  },
  {
    icon: "🔄",
    title: "Carousel slideshow",
    desc: "Multiple approved ads rotate in a smooth carousel so every advertiser gets equal screen time.",
  },
  {
    icon: "✅",
    title: "Human review process",
    desc: "Every ad is reviewed by our team before going live, keeping the platform trusted and high quality.",
  },
  {
    icon: "💳",
    title: "Simple flat pricing",
    desc: "One simple price — $100 for 1 week. No hidden fees. Full refund if your ad is not approved.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Pick a location", desc: "Browse store locations near you and select where you want your ad to display." },
  { step: "02", title: "Upload your ad", desc: "Upload your poster or image. We support all formats and sizes — we handle the rest." },
  { step: "03", title: "Pay & submit", desc: "Secure $100 payment via Stripe or PayPal. Your ad is submitted for review instantly." },
  { step: "04", title: "Go live", desc: "Once approved you get an email with a link to see your ad live on the display screen." },
];

const STATS = [
  { value: "500+", label: "Store locations" },
  { value: "2,400+", label: "Ads displayed" },
  { value: "48", label: "States covered" },
  { value: "1 week", label: "Per campaign" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="font-sans text-[#1A3A5C] overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-sm border-b border-[#D8E4EE] px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="no-underline flex items-center gap-2.5 shrink-0">
          <div className="bg-[#E8EFF6] rounded-[10px] p-1.5 flex">
            <Icon size={32} />
          </div>
          <div>
            <div className="font-serif font-bold text-[15px] text-[#1A3A5C] leading-[1.1]">Community</div>
            <div className="font-serif font-bold text-[15px] leading-[1.1]">
              <span className="text-[#E8563A]">Bulletin</span>
              <span className="text-[#4A90C4] text-[11px] font-normal">.com</span>
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="no-underline text-sm text-[#4A7FA5] font-medium hover:text-[#1A3A5C] transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="no-underline text-sm font-semibold text-[#1A3A5C] px-[18px] py-2 rounded-lg border border-[#D1DDE8] hover:bg-[#F4F7FB] transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="no-underline text-sm font-semibold text-white px-[18px] py-2 rounded-lg bg-[#1A3A5C] hover:bg-[#15304d] transition-colors">
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-[5px] p-1.5 ml-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-[#1A3A5C] transition-all duration-200 ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#1A3A5C] transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#1A3A5C] transition-all duration-200 ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden sticky top-16 z-[99] bg-white border-b border-[#D8E4EE] px-6 py-4 flex flex-col gap-1 shadow-md">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="no-underline text-sm text-[#4A7FA5] font-medium py-2.5 border-b border-[#F0F5FA] last:border-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 mt-1 flex flex-col gap-2">
            <Link href="/login" className="no-underline text-sm font-semibold text-[#1A3A5C] px-4 py-2.5 rounded-lg border border-[#D1DDE8] text-center">
              Sign in
            </Link>
            <Link href="/register" className="no-underline text-sm font-semibold text-white px-4 py-2.5 rounded-lg bg-[#1A3A5C] text-center">
              Get started free
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A3A5C] via-[#0F2540] to-[#1A3A5C] px-4 sm:px-8 py-20 sm:py-[100px] text-center">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-[#4A90C4]/[0.08] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-[#E8563A]/[0.06] pointer-events-none" />

        <div className="max-w-[760px] mx-auto relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#E8563A]/15 border border-[#E8563A]/30 rounded-full px-3.5 py-[5px] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8563A] inline-block" />
            <span className="text-xs font-semibold text-[#E8563A] tracking-[0.05em]">NOW LIVE IN 48 STATES</span>
          </div>

          <h1 className="font-serif text-[clamp(32px,6vw,64px)] font-bold text-white leading-[1.15] mb-6 tracking-tight">
            Your ad, inside the stores<br />
            <span className="text-[#E8563A]">your customers shop at</span>
          </h1>

          <p className="text-[clamp(15px,2vw,20px)] text-[#9DC4E0] leading-[1.7] max-w-[580px] mx-auto mb-10">
            CommunityBulletin puts your digital ad on screens inside local stores —
            visible through the window and to every customer who walks in.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-stretch sm:items-center">
            <Link href="/register" className="no-underline bg-[#E8563A] text-white px-8 py-3.5 rounded-[10px] text-base font-bold tracking-[0.02em] text-center">
              Post your first ad — $100
            </Link>
            <a href="#how-it-works" className="no-underline bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-[10px] text-base font-semibold text-center">
              See how it works
            </a>
          </div>

          {/* Screen mockup */}
          <div className="mt-16 bg-white/[0.05] border border-white/10 rounded-2xl p-6 max-w-[600px] mx-auto">
            <div className="bg-[#0D1B2A] rounded-xl p-1 mb-2">
              <div className="bg-[#0F3557] rounded-lg px-7 py-6 flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <div className="bg-[#4A90C4] rounded h-2.5 w-[45%] opacity-90" />
                  <div className="w-2 h-2 rounded-full bg-[#E8563A]" />
                </div>
                <div className="bg-[#7DB8DC] rounded h-[7px] w-[70%] opacity-60" />
                <div className="bg-[#7DB8DC] rounded h-[7px] w-[55%] opacity-45" />
                <div className="flex gap-2 mt-1">
                  <div className="bg-[#E8563A] rounded h-7 w-20 opacity-90 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">LEARN MORE</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-[60px] h-1.5 bg-white/10 rounded" />
            </div>
            <p className="text-[#9DC4E0] text-xs mt-2.5">Your ad displays like this on screens inside stores</p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-b border-[#D8E4EE]">
        <div className="max-w-[900px] mx-auto grid grid-cols-2 sm:grid-cols-4 px-4 sm:px-8 py-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center px-2 py-2">
              <div className="font-serif text-[32px] font-bold text-[#E8563A]">{value}</div>
              <div className="text-[13px] text-[#6B8FA8] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-4 sm:px-8 py-16 sm:py-20 bg-[#F4F7FB]">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-[#E8563A] tracking-[0.1em] uppercase mb-3">How it works</div>
            <h2 className="font-serif text-[clamp(26px,4vw,40px)] font-bold text-[#1A3A5C] mb-4">
              From idea to live screen in minutes
            </h2>
            <p className="text-base text-[#6B8FA8] max-w-[500px] mx-auto">
              No design skills needed. No long contracts. Just pick a location, upload your ad, and go.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl px-6 py-7 border border-[#D8E4EE]">
                <div className="font-serif text-[42px] font-bold text-[#E8EFF6] leading-none mb-4">{step}</div>
                <h3 className="text-base font-bold text-[#1A3A5C] mb-2">{title}</h3>
                <p className="text-sm text-[#6B8FA8] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-4 sm:px-8 py-16 sm:py-20 bg-white">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-[#E8563A] tracking-[0.1em] uppercase mb-3">Features</div>
            <h2 className="font-serif text-[clamp(26px,4vw,40px)] font-bold text-[#1A3A5C]">
              Everything you need to advertise locally
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#F4F7FB] rounded-2xl px-6 py-7 border border-[#D8E4EE]">
                <div className="text-[28px] mb-3.5">{icon}</div>
                <h3 className="text-base font-bold text-[#1A3A5C] mb-2">{title}</h3>
                <p className="text-sm text-[#6B8FA8] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-4 sm:px-8 py-16 sm:py-20 bg-[#F4F7FB]">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="text-xs font-bold text-[#E8563A] tracking-[0.1em] uppercase mb-3">Pricing</div>
          <h2 className="font-serif text-[clamp(26px,4vw,40px)] font-bold text-[#1A3A5C] mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-base text-[#6B8FA8] mb-12">
            No subscriptions. No hidden fees. Pay only when you post.
          </p>

          <div className="flex justify-center">
            <div className="bg-white rounded-2xl px-9 py-10 border-2 border-[#1A3A5C] max-w-[320px] w-full relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8563A] text-white text-[11px] font-bold px-4 py-1 rounded-full tracking-[0.05em] whitespace-nowrap">
                MOST POPULAR
              </div>
              <div className="font-serif text-[48px] font-bold text-[#1A3A5C]">$100</div>
              <div className="text-sm text-[#6B8FA8] mb-6">per location / 1 week</div>
              <ul className="list-none p-0 m-0 mb-8 text-left flex flex-col">
                {[
                  "1 store location",
                  "1-week display period",
                  "Full carousel rotation",
                  "Real-time approval status",
                  "Email notifications",
                  "Full refund if denied",
                ].map((item) => (
                  <li key={item} className="text-sm text-[#4A5568] py-1.5 flex items-center gap-2">
                    <span className="text-[#1D9E75] font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center no-underline bg-[#1A3A5C] text-white px-6 py-3 rounded-lg text-[15px] font-bold hover:bg-[#15304d] transition-colors">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR STORE OWNERS ── */}
      <section id="stores" className="px-4 sm:px-8 py-16 sm:py-20 bg-[#1A3A5C]">
        <div className="max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <div className="text-xs font-bold text-[#E8563A] tracking-[0.1em] uppercase mb-3">For store owners</div>
            <h2 className="font-serif text-[clamp(22px,3vw,36px)] font-bold text-white mb-4 leading-[1.3]">
              Turn your store window into a revenue stream
            </h2>
            <p className="text-[15px] text-[#9DC4E0] leading-[1.7] mb-7">
              Install a digital screen in your store, register your location on CommunityBulletin,
              and start earning passive income from local advertisers.
            </p>
            <ul className="list-none p-0 m-0 mb-8 flex flex-col">
              {[
                "Free to list your location",
                "You control which ads display",
                "Automatic carousel management",
                "Real-time display via Socket.io",
              ].map((item) => (
                <li key={item} className="text-sm text-[#9DC4E0] py-1.5 flex items-center gap-2">
                  <span className="text-[#E8563A] font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="inline-block no-underline bg-[#E8563A] text-white px-7 py-3 rounded-lg text-[15px] font-bold hover:bg-[#d44e34] transition-colors">
              Register your store
            </Link>
          </div>
          <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="bg-[#0D1B2A] rounded-[10px] p-1 mb-4">
              <div className="bg-[#0F3557] rounded-[7px] px-[22px] py-5 flex flex-col gap-2">
                <div className="flex justify-between">
                  <div className="bg-[#4A90C4] h-2 w-1/2 rounded opacity-90" />
                  <div className="w-[7px] h-[7px] rounded-full bg-[#E8563A]" />
                </div>
                <div className="bg-[#7DB8DC] h-1.5 w-[70%] rounded opacity-60" />
                <div className="bg-[#7DB8DC] h-1.5 w-[55%] rounded opacity-40" />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {["Local Coffee Shop ad", "Yoga Studio promo", "Pizza Place special"].map((ad, i) => (
                <div key={ad} className="flex items-center justify-between bg-white/[0.06] rounded-lg px-3.5 py-2.5">
                  <span className="text-[13px] text-[#9DC4E0]">{ad}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${i === 0 ? "bg-[#1D9E75]/20 text-[#1D9E75]" : "bg-[#4A90C4]/20 text-[#4A90C4]"}`}>
                    {i === 0 ? "LIVE" : "QUEUED"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-serif text-[clamp(26px,4vw,42px)] font-bold text-[#1A3A5C] mb-4">
            Ready to reach your community?
          </h2>
          <p className="text-base text-[#6B8FA8] mb-9 leading-[1.7]">
            Join hundreds of local businesses already advertising on CommunityBulletin.
            Your first ad is just a few clicks away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-stretch sm:items-center">
            <Link href="/register" className="no-underline bg-[#1A3A5C] text-white px-8 py-3.5 rounded-[10px] text-base font-bold text-center hover:bg-[#15304d] transition-colors">
              Create free account
            </Link>
            <Link href="/login" className="no-underline bg-white text-[#1A3A5C] border border-[#D1DDE8] px-8 py-3.5 rounded-[10px] text-base font-semibold text-center hover:bg-[#F4F7FB] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F2540] px-4 sm:px-8 pt-10 pb-6 border-t border-white/[0.08]">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand col — full width on mobile */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="bg-[#E8EFF6] rounded-lg p-1.5 flex">
                  <Icon size={24} />
                </div>
                <div>
                  <div className="font-serif font-bold text-white text-[13px] leading-[1.1]">Community</div>
                  <div className="font-serif font-bold text-[#E8563A] text-[13px] leading-[1.1]">
                    Bulletin<span className="text-[#4A90C4] text-[10px] font-normal">.com</span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-[#6B8FA8] leading-relaxed max-w-[220px]">
                Digital in-store advertising for local communities.
              </p>
            </div>

            {[
              { title: "Advertise", links: ["Post an ad", "Browse locations", "How it works", "Pricing"] },
              { title: "For Stores", links: ["List your store", "Store dashboard", "Display setup"] },
              { title: "Company", links: ["About us", "Contact", "Privacy policy", "Terms of service"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="text-xs font-bold text-white mb-3.5 tracking-[0.05em] uppercase">{title}</div>
                <ul className="list-none p-0 m-0 flex flex-col gap-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-[13px] text-[#6B8FA8] no-underline hover:text-[#9DC4E0] transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.08] pt-5 flex flex-col sm:flex-row gap-2 justify-between items-center text-center sm:text-left">
            <p className="text-xs text-[#4A7FA5]">© 2026 CommunityBulletin.com. All rights reserved.</p>
            <p className="text-xs text-[#4A7FA5]">Made with ❤️ for local communities</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
