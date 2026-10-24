"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useDisplaySocket } from "@/lib/socket/client";
import { QRCodeSVG } from "qrcode.react";
import { BrandMark } from "@/components/layout/BrandMark";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  displayOrder: number;
  contactPhone:   string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  showPhone:   boolean;
  showAddress: boolean;
  showWebsite: boolean;
};

type AdvertiseSlideSettings = {
  enabled: boolean;
  headline: string;
  subline: string;
  everyNAds: number;
};

// A carousel slide: a paid ad, or the built-in "Advertise here" slide
type Slide = { kind: "ad"; ad: Ad } | { kind: "promo"; key: string };

type LocationInfo = {
  slug: string;
  name: string;
  storeName: string;
  storeNumber: string | null;
  pricePerWeekCents?: number;
  address: string;
  address2: string | null;
  city: string;
  stateCode: string;
  postalCode: string;
};

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

function DateDisplay() {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);
  return <span>{date}</span>;
}

// Fullscreen API with the webkit-prefixed fallback older iPad Safari needs.
// iPhone Safari has no page fullscreen at all — there we offer "Add to Home Screen" instead.
const fsDoc = () => document as Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
const fsRoot = () => document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function fullscreenSupported() {
  const d = fsDoc();
  return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
}
function fullscreenActive() {
  const d = fsDoc();
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
}
function enterFullscreen() {
  const el = fsRoot();
  try {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  } catch { /* not allowed without a user gesture */ }
}
function exitFullscreen() {
  const d = fsDoc();
  try {
    if (d.exitFullscreen) d.exitFullscreen().catch(() => {});
    else d.webkitExitFullscreen?.();
  } catch { /* ignore */ }
}
/** Opened from a home-screen icon (iOS) or as an installed app — browser bars are already hidden */
function runningStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function DisplayPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [advertiseSlide, setAdvertiseSlide] = useState<AdvertiseSlideSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(true);
  const [standalone, setStandalone] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanFullscreen(fullscreenSupported());
    setStandalone(runningStandalone());
    enterFullscreen();
    const onFsChange = () => setIsFullscreen(fullscreenActive());
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Mouse movement or a tap reveals the controls for a few seconds
  function handleMouseMove() {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }

  function toggleFullscreen() {
    if (fullscreenActive()) exitFullscreen();
    else enterFullscreen();
  }

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 40 },
    [Autoplay({ delay: 8000, stopOnInteraction: false })]
  );

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${slug}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Location not found");
        return;
      }
      setError(""); // clear any prior error on success
      setLocation(json.data.location);
      setAds(json.data.ads);
      setAdvertiseSlide(json.data.advertiseSlide ?? null);
    } catch {
      setError("Failed to load ads");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Polling fallback — refreshes every 10 seconds regardless of Socket.io
  useEffect(() => {
    const id = setInterval(fetchAds, 10_000);
    return () => clearInterval(id);
  }, [fetchAds]);

  // Refresh when tab/screen becomes visible (TV kiosks throttle hidden tabs)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchAds();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchAds]);

  // Paid ads with the "Advertise here" slide after every N of them;
  // it is the only slide when a store has no ads, and appears once per loop when it has fewer than N
  const slides = useMemo<Slide[]>(() => {
    const adSlides: Slide[] = ads.map(ad => ({ kind: "ad", ad }));
    if (!advertiseSlide?.enabled) return adSlides;
    if (ads.length === 0) return [{ kind: "promo", key: "promo-0" }];
    const n = Math.max(1, advertiseSlide.everyNAds);
    const out: Slide[] = [];
    adSlides.forEach((slide, i) => {
      out.push(slide);
      if ((i + 1) % n === 0) out.push({ kind: "promo", key: `promo-${i}` });
    });
    if (ads.length < n) out.push({ kind: "promo", key: "promo-end" });
    return out;
  }, [ads, advertiseSlide]);

  // Reinitialise Embla after slides change
  useEffect(() => {
    emblaApi?.reInit();
  }, [slides, emblaApi]);

  // Count a screen view each time a slide is actually shown. Data refreshes (polling every
  // 10 s, socket pushes) rebuild `slides` but must not re-count the slide already on screen.
  const slidesRef = useRef<Slide[]>([]);
  slidesRef.current = slides;
  const initialTrackedRef = useRef(false);

  const trackShownSlide = useCallback(() => {
    if (!emblaApi) return;
    const slide = slidesRef.current[emblaApi.selectedScrollSnap()];
    // The "Advertise here" slide is not an ad view
    if (slide?.kind !== "ad") return;
    fetch(`/api/ads/${slide.ad.id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "view", location: slug }),
    }).catch(() => {});
  }, [emblaApi, slug]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", trackShownSlide);
    return () => { emblaApi.off("select", trackShownSlide); };
  }, [emblaApi, trackShownSlide]);

  // The first slide after the screen loads counts once
  useEffect(() => {
    if (initialTrackedRef.current || !emblaApi || slides.length === 0) return;
    initialTrackedRef.current = true;
    trackShownSlide();
  }, [emblaApi, slides.length, trackShownSlide]);

  // Socket.io: join location room, refresh ads on push
  useDisplaySocket(slug, fetchAds);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={fullscreen("#0A1A2E")}>
        <div style={{ textAlign: "center", color: "#4A90C4" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
          <p style={{ fontSize: 18, letterSpacing: "0.1em" }}>Loading display…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={fullscreen("#0A1A2E")}>
        <div style={{ textAlign: "center", color: "#E8563A" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📵</div>
          <p style={{ fontSize: 20 }}>{error}</p>
        </div>
      </div>
    );
  }

  // ── No ads ───────────────────────────────────────────────────────────────────
  if (slides.length === 0) {
    return (
      <div style={fullscreen("#0A1A2E")} onMouseMove={handleMouseMove} onTouchStart={handleMouseMove}>
        <FullscreenOverlay show={showControls} isFullscreen={isFullscreen} onToggle={toggleFullscreen} canFullscreen={canFullscreen} standalone={standalone} />
        {/* Header bar */}
        <HeaderBar locationName={location?.name ?? slug} storeNumber={location?.storeNumber ?? null} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64 }}>📋</div>
          <p style={{ fontSize: 22, color: "#4A90C4", letterSpacing: "0.05em" }}>No active ads at this time</p>
          <p style={{ fontSize: 14, color: "#2A4A6C" }}>Ads will appear here once approved</p>
        </div>
        <FooterBar priceCents={location?.pricePerWeekCents} />
      </div>
    );
  }

  // ── Carousel ─────────────────────────────────────────────────────────────────
  return (
    <div style={fullscreen("#0A1A2E")} onMouseMove={handleMouseMove} onTouchStart={handleMouseMove}>
      <FullscreenOverlay show={showControls} isFullscreen={isFullscreen} onToggle={toggleFullscreen} canFullscreen={canFullscreen} standalone={standalone} />
      <HeaderBar locationName={location?.name ?? slug} storeNumber={location?.storeNumber ?? null} />

      {/* Carousel */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }} ref={emblaRef}>
        <div style={{ display: "flex", height: "100%" }}>
          {slides.map((slide, idx) => {
            if (slide.kind === "promo") {
              return (
                <div key={slide.key} style={{ flex: "0 0 100%", minWidth: 0, height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
                  <AdvertiseHereSlide settings={advertiseSlide!} location={location} slug={slug} />
                </div>
              );
            }
            const ad = slide.ad;
            const hasSplit = !!(ad.contactPhone || ad.contactAddress || ad.contactWebsite);
            return (
              <div
                key={ad.id}
                style={{ flex: "0 0 100%", minWidth: 0, height: "100%", position: "relative", display: "flex", flexDirection: "column" }}
              >
                {hasSplit ? (
                  <SplitAdSlide ad={ad} idx={idx} total={slides.length} />
                ) : (
                  /* Full-screen image layout */
                  <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0A1A2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.7) 0%, transparent 18%)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "clamp(10px, 1.2vw, 15px)", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
                        Ad #{ad.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    {/* Slide counter */}
                    <div style={{ position: "absolute", top: 20, right: 24, background: "rgba(10,26,46,0.6)", color: "rgba(255,255,255,0.7)", fontSize: 13, padding: "4px 12px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                      {idx + 1} / {slides.length}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div style={{
          position: "absolute",
          bottom: 56,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 8,
          zIndex: 10,
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      <FooterBar priceCents={location?.pricePerWeekCents} />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Built-in slide selling this screen's ad space; QR opens Post a New Ad with this store pre-selected
function AdvertiseHereSlide({ settings, location, slug }: { settings: AdvertiseSlideSettings; location: LocationInfo | null; slug: string }) {
  const storeName = location?.name ?? "this store";
  const subline = settings.subline.replace(/\{store\}/g, storeName);
  const price = location?.pricePerWeekCents
    ? `$${(location.pricePerWeekCents / 100).toFixed(location.pricePerWeekCents % 100 === 0 ? 0 : 2)}`
    : null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const postUrl = `${origin}/ads/new?location=${encodeURIComponent(slug)}&src=screen`;

  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(24px, 5vw, 80px)",
      padding: "clamp(20px, 4vw, 64px)", background: "radial-gradient(ellipse at 30% 20%, #16426B 0%, #0A1A2E 70%)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "45vw", height: "45vw", borderRadius: "50%", background: "rgba(232,86,58,0.08)" }} />
      <div style={{ maxWidth: "56%", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "clamp(14px, 2vw, 28px)" }}>
          <BrandMark size={44} className="ring-1 ring-white/15 rounded-[10px]" />
          <span style={{ fontSize: "clamp(11px, 1vw, 15px)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8563A" }}>Advertise here</span>
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: "#fff", fontSize: "clamp(30px, 5vw, 76px)", lineHeight: 1.08, marginBottom: "clamp(10px, 1.6vw, 22px)" }}>
          {settings.headline}
        </div>
        {subline && (
          <div style={{ fontSize: "clamp(15px, 1.9vw, 28px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.4, marginBottom: "clamp(14px, 2.2vw, 30px)" }}>
            {subline}
          </div>
        )}
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "clamp(8px, 1vw, 14px) clamp(14px, 1.6vw, 22px)" }}>
          {price && <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(20px, 2.6vw, 40px)", color: "#fff" }}>{price}</span>}
          <span style={{ fontSize: "clamp(12px, 1.3vw, 19px)", color: "rgba(255,255,255,0.7)" }}>{price ? "/ week · " : ""}No contracts</span>
        </div>
      </div>
      {origin && (
        <div style={{ textAlign: "center", position: "relative", flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: "clamp(10px, 1.2vw, 18px)", padding: "clamp(10px, 1.2vw, 18px)", width: "clamp(150px, 20vw, 320px)", lineHeight: 0, boxShadow: "0 10px 40px rgba(0,0,0,0.35)" }}>
            <QRCodeSVG value={postUrl} size={512} level="M" marginSize={0} fgColor="#0A1A2E" bgColor="#FFFFFF" style={{ width: "100%", height: "auto" }} />
          </div>
          <div style={{ marginTop: "clamp(10px, 1.2vw, 18px)", fontSize: "clamp(14px, 1.6vw, 24px)", fontWeight: 700, color: "#fff" }}>Scan to get started</div>
          <div style={{ fontSize: "clamp(11px, 1vw, 15px)", color: "#4A90C4", marginTop: 4 }}>communitybulletin.com</div>
        </div>
      )}
    </div>
  );
}

function fullscreen(bg: string): React.CSSProperties {
  return {
    width: "100vw",
    height: "100vh",
    background: bg,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
  };
}

function HeaderBar({ locationName, storeNumber }: { locationName: string; storeNumber: string | null }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 32px",
      background: "rgba(10,26,46,0.95)",
      borderBottom: "1px solid rgba(74,144,196,0.2)",
      zIndex: 20,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{
            fontFamily: "Georgia,serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.02em",
          }}>
            Community <span style={{ color: "#E8563A" }}>Bulletin</span>
            <span style={{ color: "#4A90C4", fontSize: 12 }}>.com</span>
          </div>
        </a>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ fontSize: 13, color: "#9DC4E0", display: "flex", alignItems: "center", gap: 6 }}>
          {locationName}
          {storeNumber && (
            <>
              <span style={{ color: "#E8563A", fontWeight: 700 }}>#</span>
              <span style={{ color: "#E8563A", fontWeight: 700 }}>{storeNumber}</span>
            </>
          )}
        </div>
      </div>

      {/* Clock */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          <Clock />
        </div>
        <div style={{ fontSize: 11, color: "#4A90C4" }}>
          <DateDisplay />
        </div>
      </div>
    </div>
  );
}

function SplitAdSlide({ ad, idx, total }: { ad: Ad; idx: number; total: number }) {
  const len = ad.title.length;
  const titleSize = len <= 20
    ? "clamp(30px, 4.5vw, 66px)"
    : len <= 40
    ? "clamp(22px, 3.2vw, 48px)"
    : "clamp(17px, 2.4vw, 36px)";

  return (
    <div style={{ height: "100%", display: "flex", position: "relative" }}>
      {/* Left panel */}
      <div style={{
        width: "42%",
        background: "#0A1A2E",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(20px, 4vw, 56px)",
        position: "relative",
        flexShrink: 0,
        borderRight: "1px solid rgba(74,144,196,0.15)",
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: titleSize,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.15,
          marginBottom: "clamp(10px, 1.8vw, 22px)",
        }}>
          {ad.title}
        </div>

        {/* Description */}
        {ad.description && (
          <div style={{
            fontSize: "clamp(12px, 1.3vw, 18px)",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.6,
            marginBottom: "clamp(14px, 2vw, 28px)",
          }}>
            {ad.description}
          </div>
        )}

        {/* Accent divider + Contact Info label */}
        {(ad.showPhone || ad.showAddress || ad.showWebsite) && (
          <>
            <div style={{ width: 44, height: 3, background: "#E8563A", borderRadius: 2, marginBottom: "clamp(10px, 1.4vw, 18px)" }} />
            <div style={{ fontSize: "clamp(9px, 0.85vw, 12px)", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "clamp(8px, 1vw, 14px)" }}>
              Contact Info
            </div>
          </>
        )}

        {/* Contact fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.2vw, 16px)" }}>
          {ad.showPhone && ad.contactPhone && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "clamp(14px, 1.5vw, 22px)" }}>📞</span>
              <span style={{ fontSize: "clamp(12px, 1.4vw, 20px)", color: "#fff", fontWeight: 600 }}>{ad.contactPhone}</span>
            </div>
          )}
          {ad.showAddress && ad.contactAddress && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "clamp(14px, 1.5vw, 22px)" }}>📍</span>
              <span style={{ fontSize: "clamp(12px, 1.4vw, 20px)", color: "#fff", fontWeight: 600 }}>{ad.contactAddress}</span>
            </div>
          )}
          {ad.showWebsite && ad.contactWebsite && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "clamp(14px, 1.5vw, 22px)" }}>🌐</span>
              <a
                href={ad.contactWebsite.startsWith("http") ? ad.contactWebsite : `https://${ad.contactWebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  fetch(`/api/ads/${ad.id}/track`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "website_click" }),
                  }).catch(() => {});
                }}
                style={{ fontSize: "clamp(12px, 1.4vw, 20px)", color: "#4A90C4", fontWeight: 600, textDecoration: "underline" }}
              >
                {ad.contactWebsite}
              </a>
            </div>
          )}
        </div>

        {/* QR code — scans go through /go/[id] so they count as website visits */}
        {ad.showWebsite && ad.contactWebsite && typeof window !== "undefined" && (
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 1.4vw, 20px)", marginTop: "clamp(16px, 2.4vw, 34px)" }}>
            <div style={{
              background: "#fff",
              borderRadius: "clamp(6px, 0.7vw, 10px)",
              padding: "clamp(5px, 0.6vw, 9px)",
              width: "clamp(84px, 9.5vw, 168px)",
              flexShrink: 0,
              lineHeight: 0,
            }}>
              <QRCodeSVG
                value={`${window.location.origin}/go/${ad.id}`}
                size={256}
                level="M"
                marginSize={0}
                fgColor="#0A1A2E"
                bgColor="#FFFFFF"
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "clamp(12px, 1.3vw, 19px)", color: "#fff", fontWeight: 700, lineHeight: 1.25 }}>
                Scan to visit
              </div>
              <div style={{ fontSize: "clamp(10px, 1vw, 14px)", color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                Point your phone camera here
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Right panel — image */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <img
          src={ad.imageUrl}
          alt={ad.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Slide counter */}
      <div style={{
        position: "absolute", top: 16, right: 20,
        background: "rgba(10,26,46,0.7)", color: "rgba(255,255,255,0.7)",
        fontSize: 13, padding: "4px 12px", borderRadius: 20, backdropFilter: "blur(4px)",
      }}>
        {idx + 1} / {total}
      </div>

      {/* Ad # */}
      <div style={{
        position: "absolute", bottom: 10, right: 20,
        fontSize: "clamp(10px, 0.9vw, 13px)", color: "rgba(255,255,255,0.35)",
      }}>
        Ad #{ad.id.slice(-6).toUpperCase()}
      </div>
    </div>
  );
}

function FullscreenOverlay({ show, isFullscreen, onToggle, canFullscreen, standalone }: {
  show: boolean; isFullscreen: boolean; onToggle: () => void; canFullscreen: boolean; standalone: boolean;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 100,
      pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute",
        top: 16,
        right: 16,
        display: "flex",
        gap: 8,
        opacity: show ? 1 : 0,
        transition: "opacity 0.3s ease",
        pointerEvents: show ? "auto" : "none",
      }}>
        {/* Home */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            background: "rgba(10,26,46,0.85)",
            border: "1px solid rgba(74,144,196,0.4)",
            backdropFilter: "blur(8px)",
            color: "#9DC4E0",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </a>

        {/* iPhone: no page fullscreen — explain Add to Home Screen (hidden when already opened from the icon) */}
        {!canFullscreen && !standalone && (
          <button
            onClick={() => setShowTip(t => !t)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
              background: "rgba(10,26,46,0.85)", border: "1px solid rgba(232,86,58,0.4)", backdropFilter: "blur(8px)",
              color: "#E8A09D", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Full screen tip
          </button>
        )}

        {/* Fullscreen toggle (computers, Android, iPad) */}
        {canFullscreen && (
        <button
          onClick={onToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            background: "rgba(10,26,46,0.85)",
            border: "1px solid rgba(232,86,58,0.4)",
            backdropFilter: "blur(8px)",
            color: "#E8A09D",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {isFullscreen ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Exit Fullscreen
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
              Enter Fullscreen
            </>
          )}
        </button>
        )}
      </div>

      {showTip && show && (
        <div style={{
          position: "absolute", top: 60, right: 16, maxWidth: 300, pointerEvents: "auto",
          background: "rgba(10,26,46,0.95)", border: "1px solid rgba(74,144,196,0.4)", borderRadius: 12,
          padding: "14px 16px", color: "#E6EEF6", fontSize: 13, lineHeight: 1.5, backdropFilter: "blur(8px)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: "#fff" }}>Full screen on iPhone</div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Tap the <strong>Share</strong> button in Safari.</li>
            <li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
            <li>Open this screen from the new icon: it runs full screen, without browser bars.</li>
          </ol>
          <div style={{ marginTop: 8, color: "#9DC4E0", fontSize: 12 }}>Tip: turn the phone sideways for the best view.</div>
        </div>
      )}
    </div>
  );
}

function FooterBar({ priceCents }: { priceCents?: number }) {
  const price = priceCents ? `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}` : null;
  return (
    <div style={{
      padding: "10px 32px",
      background: "rgba(10,26,46,0.95)",
      borderTop: "1px solid rgba(74,144,196,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
      zIndex: 20,
    }}>
      <p style={{ fontSize: 12, color: "#2A4A6C" }}>
        Advertise at this location — <span style={{ color: "#4A90C4" }}>communitybulletin.com</span>
      </p>
      <p style={{ fontSize: 11, color: "#1A2A3C" }}>{price ? `${price} · ` : ""}1 week · No contracts</p>
    </div>
  );
}
