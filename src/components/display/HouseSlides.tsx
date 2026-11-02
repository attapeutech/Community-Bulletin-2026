"use client";

import { QRCodeSVG } from "qrcode.react";
import { BrandMark } from "@/components/layout/BrandMark";
import { SaleTemplate } from "@/components/display/templates/SaleTemplate";
import { ADSEZ_FAMILY, SAMPLE_SALE_AD, SAMPLE_SALE_PHOTO } from "@/lib/house-content";
import { REVEAL_START_MS, motionClass, type SlideMotion } from "@/components/display/AdvertiseHereSlide";

// Our own slides on store screens, alongside "Advertise here". Shoppers watch these from across
// the store, so anything that isn't a real ad says so in big type.

/** The sample Sale ad under a big "This could be YOUR ad" banner, so no shopper takes it for a real deal */
export function SampleAdHouseSlide({ price, postUrl, portrait, short, motion }: {
  price: string | null; postUrl: string; portrait: boolean; short: boolean; motion: SlideMotion;
}) {
  const rise = motionClass(motion, "cb-rise");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0A1A2E", minHeight: 0 }}>
      {/* Banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        padding: portrait ? "14px 18px" : short ? "8px 24px" : "clamp(10px, 1.6vw, 24px) clamp(20px, 3vw, 48px)",
        background: "#E8563A", color: "#fff",
      }}>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: portrait ? "clamp(22px, 7vw, 32px)" : short ? "clamp(18px, 6vh, 30px)" : "clamp(24px, 3.4vw, 54px)", lineHeight: 1.05 }}>
          This could be YOUR ad
        </div>
        <div style={{ fontSize: portrait ? 13 : "clamp(12px, 1.3vw, 20px)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.95 }}>
          Sample ad{price ? ` · Advertise here for ${price} / 4 weeks` : " · Advertise here"}
        </div>
      </div>

      {/* The sample, drawn by the real template */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <SaleTemplate data={SAMPLE_SALE_AD} photoUrl={SAMPLE_SALE_PHOTO} qrValue={null} address={null} phone={null} website={null} play={motion === "play"} />
        {postUrl && (
          <div className={rise} style={{
            animationDelay: `${REVEAL_START_MS + 1400}ms`, position: "absolute", right: "clamp(12px, 2vw, 36px)", bottom: "clamp(12px, 2vw, 36px)",
            background: "#fff", borderRadius: "clamp(10px, 1vw, 16px)", padding: "clamp(8px, 0.9vw, 14px)", textAlign: "center",
            width: portrait ? 120 : short ? "clamp(80px, 24vh, 130px)" : "clamp(110px, 12vw, 210px)", boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}>
            <QRCodeSVG value={postUrl} size={512} level="M" marginSize={0} fgColor="#0A1A2E" bgColor="#FFFFFF" style={{ width: "100%", height: "auto", display: "block" }} />
            <div style={{ marginTop: 6, fontSize: "clamp(10px, 1vw, 16px)", fontWeight: 800, color: "#1A3A5C", letterSpacing: "0.04em" }}>SCAN TO ADVERTISE</div>
          </div>
        )}
      </div>
    </div>
  );
}

/** "Part of the ADSEZ family": our sister sites by name only (their numbers are online and
 *  worldwide, and would read as this store's traffic on a screen) */
export function FamilyHouseSlide({ portrait, short, motion }: { portrait: boolean; short: boolean; motion: SlideMotion }) {
  const rise = motionClass(motion, "cb-rise");
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: portrait ? "24px 20px" : short ? "12px 28px" : "clamp(20px, 4vw, 64px)",
      background: "radial-gradient(ellipse at 30% 20%, #16426B 0%, #0A1A2E 70%)", position: "relative", overflow: "hidden",
    }}>
      <div className={rise} style={{ animationDelay: `${REVEAL_START_MS}ms`, display: "flex", alignItems: "center", gap: 12, marginBottom: short ? 8 : "clamp(12px, 1.6vw, 24px)" }}>
        <BrandMark size={44} className="ring-1 ring-white/15 rounded-[10px]" />
        <span style={{ fontSize: "clamp(11px, 1vw, 15px)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8563A" }}>Part of the ADSEZ family</span>
      </div>
      <div className={rise} style={{ animationDelay: `${REVEAL_START_MS + 150}ms`, fontFamily: "Georgia, serif", fontWeight: 700, color: "#fff", fontSize: portrait ? "clamp(26px, 8vw, 38px)" : short ? "clamp(22px, 8vh, 40px)" : "clamp(28px, 4.2vw, 64px)", lineHeight: 1.1, marginBottom: short ? 12 : "clamp(18px, 3vw, 44px)" }}>
        Community Bulletin&rsquo;s sister sites
      </div>
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: "clamp(10px, 1.6vw, 24px)", justifyContent: "center", width: "100%", maxWidth: 1000 }}>
        {ADSEZ_FAMILY.map((s, i) => (
          <div key={s.name} className={rise} style={{
            animationDelay: `${REVEAL_START_MS + 400 + i * 150}ms`, flex: 1,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 14,
            padding: short ? "10px 14px" : "clamp(12px, 1.6vw, 26px)",
          }}>
            <div style={{ fontSize: portrait ? 18 : "clamp(15px, 1.7vw, 28px)", fontWeight: 700, color: "#fff", overflowWrap: "anywhere" }}>{s.name}</div>
            <div style={{ fontSize: portrait ? 14 : "clamp(12px, 1.2vw, 20px)", color: "#9DC4E0", marginTop: 4 }}>{s.what}</div>
          </div>
        ))}
      </div>
      <div className={rise} style={{ animationDelay: `${REVEAL_START_MS + 1000}ms`, marginTop: short ? 10 : "clamp(14px, 2.4vw, 36px)", fontSize: "clamp(12px, 1.2vw, 18px)", color: "#4A90C4" }}>
        adsez.com
      </div>
    </div>
  );
}
