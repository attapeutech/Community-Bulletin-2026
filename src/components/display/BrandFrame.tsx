"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";

// Small credit line under the clock
const POWERED_BY = "Powered by ADSEZ.com";

/**
 * "Clean channel" brand frame: the bar along the bottom of every slide on the new screen design,
 * so a screen reads as Community Bulletin at a glance (like a TV channel's logo bar).
 */
export function BrandFrame({ storeName, storeNumber, priceCents, allLocations, portrait }: {
  storeName: string;
  storeNumber: string | null;
  priceCents?: number;
  allLocations?: boolean;
  portrait: boolean;
}) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  const price = priceCents ? `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}` : null;
  const where = allLocations
    ? "Ads from local businesses"
    : `Ads from your neighbors · at ${storeName}${storeNumber ? ` #${storeNumber.replace(/^#/, "")}` : ""}`;

  return (
    <div style={{
      flexShrink: 0, zIndex: 20, position: "relative",
      display: "flex", alignItems: "center", gap: portrait ? 12 : "clamp(14px, 1.4vw, 26px)",
      height: portrait ? "clamp(56px, 7.5vh, 110px)" : "clamp(56px, 10.5vh, 120px)",
      padding: portrait ? "0 14px" : "0 clamp(18px, 2.5vw, 48px)",
      background: "linear-gradient(180deg, #13304F, #0F2540)",
      borderTop: "clamp(2px, 0.35vh, 4px) solid #E8563A",
    }}>
      <a href="/" target="_top" style={{ display: "flex", flexShrink: 0 }} aria-label="CommunityBulletin.com">
        <BrandMark size={portrait ? 36 : 56} className="ring-1 ring-white/15 rounded-[12px]" />
      </a>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: portrait ? 17 : "clamp(16px, 2vw, 38px)", lineHeight: 1.05, color: "#fff", whiteSpace: "nowrap" }}>
          Community <span style={{ color: "#E8563A" }}>Bulletin</span>
        </div>
        {!portrait && (
          <div style={{ fontSize: "clamp(11px, 1.35vw, 26px)", color: "#9DC4E0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
            {where}
          </div>
        )}
      </div>
      <div style={{ flex: 1 }} />
      {price && (
        <div style={{ textAlign: "right", color: "#9DC4E0", fontSize: portrait ? 11 : "clamp(11px, 1.15vw, 22px)", lineHeight: 1.3, whiteSpace: "nowrap" }}>
          Advertise here
          <div style={{ color: "#fff", fontWeight: 700 }}>{allLocations ? "from " : ""}{price} / 4 weeks</div>
        </div>
      )}
      <div style={{ width: 1, alignSelf: "stretch", margin: "18% 0", background: "rgba(255,255,255,0.15)" }} />
      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: portrait ? 17 : "clamp(16px, 2.1vw, 40px)", fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
          {time}
        </div>
        <div style={{ fontSize: portrait ? 9 : "clamp(9px, 0.85vw, 16px)", color: "rgba(157,196,224,0.75)", letterSpacing: "0.02em", marginTop: 2 }}>
          {POWERED_BY}
        </div>
      </div>
    </div>
  );
}
