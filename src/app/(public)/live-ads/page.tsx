"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LiveAdsGrid from "@/components/marketing/LiveAdsGrid";

function LiveAdsContent() {
  const searchParams = useSearchParams();
  const state  = searchParams.get("state")  ?? "";
  const city   = searchParams.get("city")   ?? "";
  const search = searchParams.get("search") ?? "";

  const locationLabel = state
    ? city ? `${city}, ${state}` : state
    : null;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#E8563A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            Live right now
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, color: "#1A3A5C", margin: 0 }}>
            {locationLabel ? `Live Ads — ${locationLabel}` : "All Live Ads"}
          </h1>
        </div>
      </div>
      <LiveAdsGrid state={state} city={city} search={search} />
    </div>
  );
}

export default function LiveAdsPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <div className="skeleton" style={{ width: 200, height: 34, marginBottom: 28, borderRadius: 6 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 280, borderRadius: 14 }} />
          ))}
        </div>
      </div>
    }>
      <LiveAdsContent />
    </Suspense>
  );
}
