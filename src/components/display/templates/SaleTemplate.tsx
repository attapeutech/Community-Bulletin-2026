"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { QRCodeSVG } from "qrcode.react";
import type { SaleTemplateData } from "@/lib/ad-templates";

gsap.registerPlugin(SplitText);

// Fixed design size (like a 1080p TV); the whole ad is scaled to fit the space it's given and centred
const LANDSCAPE = { w: 1920, h: 1080 };
const PORTRAIT = { w: 1080, h: 1920 };

/**
 * "Sale / Offer" template: business name, a big offer ("20% OFF"), headline, details, end date,
 * the advertiser's photo and (when they gave a website) a QR code. The screen draws it, so it's sharp
 * on any display, in landscape or portrait. `play` runs the GSAP entrance (1–2 s, then it holds still
 * with a slow push on the photo); screens set to reduce motion show it without animation.
 */
export function SaleTemplate({ data, photoUrl, qrValue, address, phone, website, play }: {
  data: SaleTemplateData;
  photoUrl: string | null;
  qrValue: string | null;   // QR destination (the ad's /go/<id> link on screens); null = no QR
  address: string | null;   // each contact item only when the advertiser turned it on
  phone: string | null;
  website: string | null;
  play: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ portrait: false, scale: 0, x: 0, y: 0, w: LANDSCAPE.w, h: LANDSCAPE.h });

  // Fit the design into the container (re-fits on resize). The long side stretches to the container's
  // shape (within limits), so a slide area a little wider or taller than 16:9 has no letterbox strips.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const portrait = h > w * 1.05;
      const base = portrait ? PORTRAIT : LANDSCAPE;
      const size = portrait
        ? { w: base.w, h: Math.round(Math.min(2400, Math.max(1500, base.w * (h / w)))) }
        : { w: Math.round(Math.min(2560, Math.max(1440, base.h * (w / h)))), h: base.h };
      const scale = Math.min(w / size.w, h / size.h);
      setFit({ portrait, scale, x: (w - size.w * scale) / 2, y: (h - size.h * scale) / 2, w: size.w, h: size.h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Entrance animation whenever this ad comes on screen (and when the layout or text changes)
  const animKey = `${fit.portrait}|${data.headline}|${data.offerBig}|${data.offerSmall}|${photoUrl}`;
  useEffect(() => {
    const root = stage.current;
    if (!play || !root || !fit.scale) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const q = (sel: string) => root.querySelector(sel);
    const ctx = gsap.context(() => {
      const headline = q("[data-t=headline]");
      const split = headline ? SplitText.create(headline, { type: "words" }) : null;
      gsap.timeline()
        .from(q("[data-t=photo]"), { xPercent: fit.portrait ? 0 : 12, yPercent: fit.portrait ? -12 : 0, scale: 1.12, opacity: 0, duration: 1.1, ease: "power3.out" })
        .from(q("[data-t=biz]"), { y: 24, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.15)
        .from(q("[data-t=big]"), { scale: 1.8, rotation: -8, opacity: 0, duration: 0.55, ease: "back.out(2.2)" }, 0.3)
        .from(q("[data-t=small]"), { x: -30, opacity: 0, duration: 0.4, ease: "power2.out" }, 0.55)
        .from(split?.words ?? [], { y: 50, opacity: 0, duration: 0.5, stagger: 0.09, ease: "power3.out" }, 0.6)
        .from(q("[data-t=bar]"), { scaleX: 0, duration: 0.45, ease: "power2.out" }, 0.95)
        .from(root.querySelectorAll("[data-t=sub], [data-t=meta], [data-t=contact]"), { y: 30, opacity: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" }, 1.05)
        .from(q("[data-t=qr]"), { scale: 0.6, opacity: 0, duration: 0.5, ease: "back.out(1.8)" }, 1.3)
        // a gentle, slow push on the photo while the ad holds
        .to(q("[data-t=photo-img]"), { scale: 1.06, duration: 8, ease: "none" }, 1.1);
    }, root);
    return () => ctx.revert();
  }, [play, fit.scale, animKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const size = { w: fit.w, h: fit.h };
  const p = fit.portrait;
  const bigLen = data.offerBig.length;
  const bigSize = bigLen <= 4 ? 230 : bigLen <= 6 ? 180 : 140;
  const ends = data.ends.trim();
  const site = website ? website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "") : null;

  return (
    <div ref={box} style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0A1A2E" }}>
      {fit.scale > 0 && (
        <div
          ref={stage}
          style={{
            position: "absolute", left: 0, top: 0, width: size.w, height: size.h, overflow: "hidden",
            transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`, transformOrigin: "0 0",
            background: "radial-gradient(120% 90% at 20% 10%, #1D4570 0%, #0F2540 55%, #0A1A2E 100%)",
            color: "#fff", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Photo: right half (landscape) or top (portrait) */}
          <div data-t="photo" style={{
            position: "absolute", overflow: "hidden", background: "#13304F",
            ...(p ? { top: 0, left: 0, right: 0, height: "44%" } : { top: 0, right: 0, bottom: 0, width: "46%" }),
          }}>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img data-t="photo-img" src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: p ? "linear-gradient(0deg, rgba(10,26,46,.55), transparent 35%)" : "linear-gradient(90deg, rgba(10,26,46,.55), transparent 35%)" }} />
          </div>

          {/* Text */}
          <div style={{
            position: "absolute", display: "flex", flexDirection: "column",
            ...(p ? { left: 72, right: 72, top: "44%", paddingTop: 70 } : { left: 96, top: 0, bottom: 0, width: "46%", justifyContent: "center" }),
          }}>
            {data.businessName && (
              <div data-t="biz" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9DC4E0" }}>
                {data.businessName}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: 22, margin: "18px 0 4px", flexWrap: "wrap" }}>
              <span data-t="big" style={{ display: "inline-block", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: bigSize, lineHeight: 0.9, color: "#E8563A", letterSpacing: -6 }}>
                {data.offerBig || " "}
              </span>
              {data.offerSmall && (
                <span data-t="small" style={{ display: "inline-block", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 96, color: "#E8563A" }}>
                  {data.offerSmall}
                </span>
              )}
            </div>
            <h2 data-t="headline" style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 96, lineHeight: 1.05, margin: 0, overflowWrap: "break-word" }}>
              {data.headline}
            </h2>
            <div data-t="bar" style={{ height: 10, width: 220, background: "#E8563A", borderRadius: 5, margin: "26px 0 30px", transformOrigin: "left center" }} />
            {data.details && (
              <div data-t="sub" style={{ fontSize: 40, lineHeight: 1.35, color: "rgba(255,255,255,.82)" }}>{data.details}</div>
            )}
            {(ends || address) && (
              <div data-t="meta" style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 46, flexWrap: "wrap" }}>
                {ends && <span style={{ fontSize: 32, fontWeight: 700, background: "#E8563A", color: "#fff", borderRadius: 999, padding: "10px 26px", whiteSpace: "nowrap" }}>{ends}</span>}
                {address && <span style={{ fontSize: 30, color: "rgba(255,255,255,.75)" }}>{address}</span>}
              </div>
            )}
            {(phone || site) && (
              <div data-t="contact" style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 26, flexWrap: "wrap", fontSize: 34, fontWeight: 600, color: "#fff" }}>
                {phone && <span style={{ whiteSpace: "nowrap" }}>📞 {phone}</span>}
                {site && <span style={{ color: "#9DC4E0", overflowWrap: "anywhere" }}>🌐 {site}</span>}
              </div>
            )}
          </div>

          {/* QR code (when the advertiser gave a website) */}
          {qrValue && (
            <div data-t="qr" style={{ position: "absolute", right: p ? 72 : 56, bottom: p ? 72 : 56, background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 10px 24px rgba(0,0,0,.35)" }}>
              <QRCodeSVG value={qrValue} size={180} level="M" marginSize={0} fgColor="#0A1A2E" bgColor="#FFFFFF" />
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1A3A5C", textAlign: "center", marginTop: 8, letterSpacing: "0.04em" }}>SCAN FOR DEAL</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
