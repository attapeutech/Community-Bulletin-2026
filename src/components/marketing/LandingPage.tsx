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
    desc: "One simple price — $100 for 30 days. No hidden fees. Full refund if your ad is not approved.",
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
  { value: "30 days", label: "Per campaign" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", color: "#1A3A5C", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "0.5px solid #D8E4EE",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#E8EFF6", borderRadius: 10, padding: 7, display: "flex" }}>
            <Icon size={32} />
          </div>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 15, color: "#1A3A5C", lineHeight: 1.1 }}>Community</div>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>
              <span style={{ color: "#E8563A" }}>Bulletin</span>
              <span style={{ color: "#4A90C4", fontSize: 11, fontWeight: 400 }}>.com</span>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} style={{ textDecoration: "none", fontSize: 14, color: "#4A7FA5", fontWeight: 500 }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{
            textDecoration: "none", fontSize: 14, fontWeight: 600, color: "#1A3A5C",
            padding: "8px 18px", borderRadius: 8, border: "1px solid #D1DDE8",
          }}>
            Sign in
          </Link>
          <Link href="/register" style={{
            textDecoration: "none", fontSize: 14, fontWeight: 600, color: "#fff",
            padding: "8px 18px", borderRadius: 8, background: "#1A3A5C",
          }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(160deg, #1A3A5C 0%, #0F2540 60%, #1A3A5C 100%)",
        padding: "100px 32px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(74,144,196,0.08)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(232,86,58,0.06)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(232,86,58,0.15)", border: "1px solid rgba(232,86,58,0.3)",
            borderRadius: 20, padding: "5px 14px", marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8563A", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#E8563A", letterSpacing: "0.05em" }}>
              NOW LIVE IN 48 STATES
            </span>
          </div>

          <h1 style={{
            fontFamily: "Georgia,serif", fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 700, color: "#fff", lineHeight: 1.15,
            marginBottom: 24, letterSpacing: "-0.5px",
          }}>
            Your ad, inside the stores<br />
            <span style={{ color: "#E8563A" }}>your customers shop at</span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: "#9DC4E0",
            lineHeight: 1.7, marginBottom: 40, maxWidth: 580, margin: "0 auto 40px",
          }}>
            CommunityBulletin puts your digital ad on screens inside local stores —
            visible through the window and to every customer who walks in.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              textDecoration: "none", background: "#E8563A", color: "#fff",
              padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 700,
              letterSpacing: "0.02em",
            }}>
              Post your first ad — $100
            </Link>
            <Link href="#how-it-works" style={{
              textDecoration: "none", background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600,
            }}>
              See how it works
            </Link>
          </div>

          {/* Screen mockup */}
          <div style={{
            marginTop: 64,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: 24,
            maxWidth: 600, margin: "64px auto 0",
          }}>
            {/* TV bezel */}
            <div style={{ background: "#0D1B2A", borderRadius: 12, padding: 4, marginBottom: 8 }}>
              <div style={{
                background: "#0F3557", borderRadius: 8, padding: "24px 28px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ background: "#4A90C4", borderRadius: 4, height: 10, width: "45%", opacity: 0.9 }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8563A" }} />
                </div>
                <div style={{ background: "#7DB8DC", borderRadius: 3, height: 7, width: "70%", opacity: 0.6 }} />
                <div style={{ background: "#7DB8DC", borderRadius: 3, height: 7, width: "55%", opacity: 0.45 }} />
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <div style={{ background: "#E8563A", borderRadius: 4, height: 28, width: 80, opacity: 0.9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>LEARN MORE</span>
                  </div>
                </div>
              </div>
            </div>
            {/* TV stand */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 60, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }} />
            </div>
            <p style={{ color: "#9DC4E0", fontSize: 12, marginTop: 10, textAlign: "center" }}>
              Your ad displays like this on screens inside stores
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "#fff", borderBottom: "0.5px solid #D8E4EE" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          padding: "32px 32px",
        }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center", padding: "0 16px" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 32, fontWeight: 700, color: "#E8563A" }}>{value}</div>
              <div style={{ fontSize: 13, color: "#6B8FA8", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "80px 32px", background: "#F4F7FB" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E8563A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              How it works
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#1A3A5C", marginBottom: 16 }}>
              From idea to live screen in minutes
            </h2>
            <p style={{ fontSize: 16, color: "#6B8FA8", maxWidth: 500, margin: "0 auto" }}>
              No design skills needed. No long contracts. Just pick a location, upload your ad, and go.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} style={{
                background: "#fff", borderRadius: 14, padding: "28px 24px",
                border: "0.5px solid #D8E4EE", position: "relative",
              }}>
                <div style={{
                  fontFamily: "Georgia,serif", fontSize: 42, fontWeight: 700,
                  color: "#E8EFF6", lineHeight: 1, marginBottom: 16,
                }}>{step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A3A5C", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#6B8FA8", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 32px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E8563A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Features
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#1A3A5C" }}>
              Everything you need to advertise locally
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: "#F4F7FB", borderRadius: 14, padding: "28px 24px",
                border: "0.5px solid #D8E4EE",
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A3A5C", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#6B8FA8", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "80px 32px", background: "#F4F7FB" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#E8563A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Pricing
          </div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#1A3A5C", marginBottom: 16 }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 16, color: "#6B8FA8", marginBottom: 48 }}>
            No subscriptions. No hidden fees. Pay only when you post.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {/* Single ad card */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "40px 36px",
              border: "2px solid #1A3A5C", maxWidth: 320, flex: "1 1 280px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                background: "#E8563A", color: "#fff", fontSize: 11, fontWeight: 700,
                padding: "4px 16px", borderRadius: 20, letterSpacing: "0.05em",
              }}>
                MOST POPULAR
              </div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 48, fontWeight: 700, color: "#1A3A5C" }}>$100</div>
              <div style={{ fontSize: 14, color: "#6B8FA8", marginBottom: 24 }}>per location / 30 days</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", textAlign: "left" }}>
                {[
                  "1 store location",
                  "30-day display period",
                  "Full carousel rotation",
                  "Real-time approval status",
                  "Email notifications",
                  "Full refund if denied",
                ].map((item) => (
                  <li key={item} style={{ fontSize: 14, color: "#4A5568", padding: "6px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#1D9E75", fontWeight: 700 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" style={{
                display: "block", textAlign: "center", textDecoration: "none",
                background: "#1A3A5C", color: "#fff",
                padding: "12px 24px", borderRadius: 8, fontSize: 15, fontWeight: 700,
              }}>
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR STORE OWNERS ── */}
      <section id="stores" style={{ padding: "80px 32px", background: "#1A3A5C" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E8563A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              For store owners
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, color: "#fff", marginBottom: 16, lineHeight: 1.3 }}>
              Turn your store window into a revenue stream
            </h2>
            <p style={{ fontSize: 15, color: "#9DC4E0", lineHeight: 1.7, marginBottom: 28 }}>
              Install a digital screen in your store, register your location on CommunityBulletin,
              and start earning passive income from local advertisers.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
              {[
                "Free to list your location",
                "You control which ads display",
                "Automatic carousel management",
                "Real-time display via Socket.io",
              ].map((item) => (
                <li key={item} style={{ fontSize: 14, color: "#9DC4E0", padding: "6px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#E8563A", fontWeight: 700 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{
              display: "inline-block", textDecoration: "none",
              background: "#E8563A", color: "#fff",
              padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700,
            }}>
              Register your store
            </Link>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: 32,
          }}>
            <div style={{ background: "#0D1B2A", borderRadius: 10, padding: 4, marginBottom: 16 }}>
              <div style={{ background: "#0F3557", borderRadius: 7, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ background: "#4A90C4", height: 8, width: "50%", borderRadius: 3, opacity: 0.9 }} />
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8563A" }} />
                </div>
                <div style={{ background: "#7DB8DC", height: 6, width: "70%", borderRadius: 3, opacity: 0.6 }} />
                <div style={{ background: "#7DB8DC", height: 6, width: "55%", borderRadius: 3, opacity: 0.4 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Local Coffee Shop ad", "Yoga Studio promo", "Pizza Place special"].map((ad, i) => (
                <div key={ad} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px",
                }}>
                  <span style={{ fontSize: 13, color: "#9DC4E0" }}>{ad}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                    background: i === 0 ? "rgba(29,158,117,0.2)" : "rgba(74,144,196,0.2)",
                    color: i === 0 ? "#1D9E75" : "#4A90C4",
                  }}>
                    {i === 0 ? "LIVE" : "QUEUED"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 32px", background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: "#1A3A5C", marginBottom: 16 }}>
            Ready to reach your community?
          </h2>
          <p style={{ fontSize: 16, color: "#6B8FA8", marginBottom: 36, lineHeight: 1.7 }}>
            Join hundreds of local businesses already advertising on CommunityBulletin.
            Your first ad is just a few clicks away.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              textDecoration: "none", background: "#1A3A5C", color: "#fff",
              padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 700,
            }}>
              Create free account
            </Link>
            <Link href="/login" style={{
              textDecoration: "none", background: "#fff", color: "#1A3A5C",
              padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600,
              border: "1px solid #D1DDE8",
            }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#0F2540", padding: "40px 32px 24px",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#E8EFF6", borderRadius: 8, padding: 6, display: "flex" }}>
                  <Icon size={24} />
                </div>
                <div>
                  <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, color: "#fff", fontSize: 13, lineHeight: 1.1 }}>Community</div>
                  <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, color: "#E8563A", fontSize: 13, lineHeight: 1.1 }}>Bulletin<span style={{ color: "#4A90C4", fontSize: 10, fontWeight: 400 }}>.com</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#6B8FA8", lineHeight: 1.6, maxWidth: 220 }}>
                Digital in-store advertising for local communities.
              </p>
            </div>
            {[
              { title: "Advertise", links: ["Post an ad", "Browse locations", "How it works", "Pricing"] },
              { title: "For Stores", links: ["List your store", "Store dashboard", "Display setup"] },
              { title: "Company", links: ["About us", "Contact", "Privacy policy", "Terms of service"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" style={{ fontSize: 13, color: "#6B8FA8", textDecoration: "none" }}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: "#4A7FA5" }}>© 2026 CommunityBulletin.com. All rights reserved.</p>
            <p style={{ fontSize: 12, color: "#4A7FA5" }}>Made with ❤️ for local communities</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
