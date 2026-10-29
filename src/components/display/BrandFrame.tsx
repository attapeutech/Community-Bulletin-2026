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
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
      // Full date like the current design ("Thursday, October 29, 2026"); short on portrait screens
      setDate(now.toLocaleDateString("en-US", portrait
        ? { weekday: "short", month: "short", day: "numeric" }
        : { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [portrait]);

  const price = priceCents ? `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}` : null;
  const where = allLocations
    ? "Ads from local businesses"
    : `Ads from your neighbors · at ${storeName}${storeNumber ? ` #${storeNumber.replace(/^#/, "")}` : ""}`;

  return (
    <div style={{
      flexShrink: 0, zIndex: 20, position: "relative",
      display: "flex", alignItems: "center", gap: portrait ? 10 : "clamp(12px, 1.2vw, 22px)",
      // Slim, so the ad stays the focus (about 8% of the screen's height)
      height: portrait ? "clamp(48px, 6vh, 90px)" : "clamp(48px, 8vh, 96px)",
      padding: portrait ? "0 12px" : "0 clamp(16px, 2.2vw, 42px)",
      background: "linear-gradient(180deg, #13304F, #0F2540)",
      borderTop: "clamp(2px, 0.3vh, 3px) solid #E8563A",
    }}>
      <a href="/" target="_top" style={{ display: "flex", flexShrink: 0 }} aria-label="CommunityBulletin.com">
        <BrandMark size={portrait ? 30 : 44} className="ring-1 ring-white/15 rounded-[10px]" />
      </a>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: portrait ? 15 : "clamp(14px, 1.6vw, 30px)", lineHeight: 1.05, color: "#fff", whiteSpace: "nowrap" }}>
          Community <span style={{ color: "#E8563A" }}>Bulletin</span>
        </div>
        {portrait ? (
          // No room in the middle on portrait screens: the credit sits under the name
          <div style={{ fontSize: 9, color: "rgba(157,196,224,0.6)", whiteSpace: "nowrap", marginTop: 2 }}>{POWERED_BY}</div>
        ) : (
          <div style={{ fontSize: "clamp(10px, 1.05vw, 20px)", color: "#9DC4E0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
            {where}
          </div>
        )}
      </div>

      {/* Credit, centred in the bar (landscape) */}
      {!portrait && (
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
          fontSize: "clamp(9px, 0.8vw, 15px)", color: "rgba(157,196,224,0.55)", letterSpacing: "0.04em", whiteSpace: "nowrap",
        }}>
          {POWERED_BY}
        </div>
      )}

      <div style={{ flex: 1 }} />
      {price && (
        <div style={{ textAlign: "right", color: "#9DC4E0", fontSize: portrait ? 10 : "clamp(10px, 0.95vw, 18px)", lineHeight: 1.3, whiteSpace: "nowrap" }}>
          Advertise here
          <div style={{ color: "#fff", fontWeight: 700 }}>{allLocations ? "from " : ""}{price} / 4 weeks</div>
        </div>
      )}
      <div style={{ width: 1, height: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: portrait ? 15 : "clamp(14px, 1.7vw, 32px)", fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
          {time}
        </div>
        <div style={{ fontSize: portrait ? 10 : "clamp(10px, 0.9vw, 17px)", color: "#9DC4E0", marginTop: 2 }}>
          {date}
        </div>
      </div>
    </div>
  );
}
