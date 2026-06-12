"use client";

import Link from "next/link";
import LiveAdsGrid from "./LiveAdsGrid";

export default function LiveAdsSection() {
  return (
    <section id="live-ads" style={{ background: "#F4F7FB", padding: "56px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E8563A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
              Live right now
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, color: "#1A3A5C", margin: 0 }}>
              Currently running ads
            </h2>
          </div>
          <Link
            href="/live-ads"
            style={{ fontSize: 13, fontWeight: 600, color: "#4A90C4", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
          >
            View all live ads →
          </Link>
        </div>

        {/* Grid — teaser, max 6 */}
        <LiveAdsGrid limit={6} />

        {/* See more */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            href="/live-ads"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1A3A5C", color: "#fff", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
          >
            Browse all live ads →
          </Link>
        </div>
      </div>
    </section>
  );
}
