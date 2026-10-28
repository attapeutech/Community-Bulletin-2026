"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BrandMark } from "@/components/layout/BrandMark";

// Shared by the store display screens and the Live Ads page

// Text reveal starts this long after a slide begins gliding in (the glide takes ~0.6 s)
export const REVEAL_START_MS = 280;
// Title words appear this far apart; once all have landed the title "pops"
export const TITLE_WORD_STEP_MS = 180;

// play: animate in now · hold: keep hidden · none: show as-is
export type SlideMotion = "play" | "hold" | "none";
export const motionClass = (motion: SlideMotion, play: string, hold = "cb-hold") =>
  motion === "play" ? play : motion === "hold" ? hold : undefined;

/** Phone (or small tablet) held upright — the TV layout is stacked vertically instead */
export function usePortraitPhone() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 820px)");
    setPortrait(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPortrait(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return portrait;
}

/** Phone held sideways: wide but short — the text panel is compacted so nothing spills off */
export function useShortLandscape() {
  const [short, setShort] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 560px)");
    setShort(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setShort(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return short;
}

/** The "Advertise here" slide: headline built word by word, price, and a QR code to post an ad */
export function AdvertiseHereSlide({ headline, subline, reach, price, pricePrefix = "", postUrl, portrait, short, motion }: {
  headline: string; subline: string; reach?: string | null; price: string | null; pricePrefix?: string; postUrl: string;
  portrait: boolean; short: boolean; motion: SlideMotion;
}) {
  const rise = motionClass(motion, "cb-rise");
  // Headline builds up word by word and pops, like an ad title; the rest follows it
  const headlineWords = headline.trim().split(/\s+/);
  const headlineStartMs = REVEAL_START_MS + 120;
  const headlineDoneMs = headlineStartMs + Math.min(headlineWords.length, 8) * TITLE_WORD_STEP_MS + 450;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", justifyContent: "center",
      gap: portrait ? 22 : "clamp(24px, 5vw, 80px)", textAlign: portrait ? "center" : undefined,
      padding: portrait ? "24px 20px" : short ? "12px 28px" : "clamp(20px, 4vw, 64px)", background: "radial-gradient(ellipse at 30% 20%, #16426B 0%, #0A1A2E 70%)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "45vw", height: "45vw", borderRadius: "50%", background: "rgba(232,86,58,0.08)" }} />
      <div style={{ maxWidth: portrait ? "100%" : "56%", position: "relative" }}>
        <div className={rise} style={{ animationDelay: `${REVEAL_START_MS + 0}ms`, display: "flex", alignItems: "center", justifyContent: portrait ? "center" : undefined, gap: 12, marginBottom: short ? 8 : "clamp(14px, 2vw, 28px)" }}>
          <BrandMark size={44} className="ring-1 ring-white/15 rounded-[10px]" />
          <span style={{ fontSize: "clamp(11px, 1vw, 15px)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8563A" }}>Advertise here</span>
        </div>
        <div className={motionClass(motion, "cb-pop")} style={{ animationDelay: `${headlineDoneMs}ms`, transformOrigin: portrait ? "center" : "left center", fontFamily: "Georgia, serif", fontWeight: 700, color: "#fff", fontSize: portrait ? "clamp(28px, 9vw, 40px)" : short ? "clamp(24px, 9vh, 44px)" : "clamp(30px, 5vw, 76px)", lineHeight: 1.08, marginBottom: short ? 6 : "clamp(10px, 1.6vw, 22px)" }}>
          {headlineWords.map((word, i) => (
            <span key={i}>
              <span className={motionClass(motion, "cb-word")} style={{ display: "inline-block", animationDelay: `${headlineStartMs + Math.min(i, 7) * TITLE_WORD_STEP_MS}ms` }}>
                {word}
              </span>
              {i < headlineWords.length - 1 && " "}
            </span>
          ))}
        </div>
        {subline && (
          <div className={rise} style={{ animationDelay: `${headlineDoneMs}ms`, fontSize: "clamp(15px, 1.9vw, 28px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.4, marginBottom: short ? 10 : "clamp(14px, 2.2vw, 30px)" }}>
            {subline}
          </div>
        )}
        {reach && (
          <div className={rise} style={{ animationDelay: `${headlineDoneMs + 60}ms`, display: "flex", alignItems: "center", justifyContent: portrait ? "center" : undefined, gap: 8, fontSize: "clamp(15px, 1.8vw, 26px)", fontWeight: 700, color: "#7EE2A8", marginTop: short ? -4 : "clamp(-6px, -0.8vw, -14px)", marginBottom: short ? 10 : "clamp(14px, 2.2vw, 30px)" }}>
            <span style={{ width: "0.55em", height: "0.55em", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 0 4px rgba(34,197,94,0.2)", flexShrink: 0 }} />
            {reach}
          </div>
        )}
        <div className={rise} style={{ animationDelay: `${headlineDoneMs + 120}ms`, display: "inline-flex", alignItems: "baseline", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "clamp(8px, 1vw, 14px) clamp(14px, 1.6vw, 22px)" }}>
          {price && <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(20px, 2.6vw, 40px)", color: "#fff" }}>{pricePrefix}{price}</span>}
          <span style={{ fontSize: "clamp(12px, 1.3vw, 19px)", color: "rgba(255,255,255,0.7)" }}>{price ? "/ month · " : ""}No contracts</span>
        </div>
      </div>
      {postUrl && (
        <div className={rise} style={{ animationDelay: `${headlineDoneMs + 260}ms`, textAlign: "center", position: "relative", flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: "clamp(10px, 1.2vw, 18px)", padding: "clamp(10px, 1.2vw, 18px)", width: portrait ? 170 : short ? "clamp(100px, 34vh, 170px)" : "clamp(150px, 20vw, 320px)", lineHeight: 0, boxShadow: "0 10px 40px rgba(0,0,0,0.35)" }}>
            <QRCodeSVG value={postUrl} size={512} level="M" marginSize={0} fgColor="#0A1A2E" bgColor="#FFFFFF" style={{ width: "100%", height: "auto" }} />
          </div>
          <div style={{ marginTop: "clamp(10px, 1.2vw, 18px)", fontSize: "clamp(14px, 1.6vw, 24px)", fontWeight: 700, color: "#fff" }}>Scan to get started</div>
          <div style={{ fontSize: "clamp(11px, 1vw, 15px)", color: "#4A90C4", marginTop: 4 }}>communitybulletin.com</div>
        </div>
      )}
    </div>
  );
}
