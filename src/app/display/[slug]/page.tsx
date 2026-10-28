"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useDisplaySocket } from "@/lib/socket/client";
import { screenCheckin, goToScreen } from "@/lib/screen-device";
import { QRCodeSVG } from "qrcode.react";
import { BrandMark } from "@/components/layout/BrandMark";
import { HeartButton } from "@/components/ui/HeartButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { AdvertiseHereSlide, REVEAL_START_MS, TITLE_WORD_STEP_MS, motionClass, usePortraitPhone, useShortLandscape, type SlideMotion } from "@/components/display/AdvertiseHereSlide";

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


const RECONNECTING = "__reconnecting__";


type LocationInfo = {
  slug: string;
  name: string;
  storeName: string;
  storeNumber: string | null;
  pricePerRunCents?: number;
  allLocations?: boolean;   // the /display/all screen (every store's ads)
  dailyCustomers?: number | null;
  address: string;
  address2: string | null;
  city: string;
  stateCode: string;
  postalCode: string;
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

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
  const portrait = usePortraitPhone();
  const short = useShortLandscape();
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
    { loop: true, duration: 30 },
    [Autoplay({ delay: 8000, stopOnInteraction: false })]
  );

  // If the server is briefly unreachable (a deploy, a Wi-Fi blip), keep showing the current ads
  // and retry on the next poll; only a screen that has never loaded shows "Connecting…"
  const loadedOnceRef = useRef(false);
  const versionRef = useRef<string | null>(null);
  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${slug}`, { cache: "no-store" });
      if (res.status === 404) {
        const j = await res.json().catch(() => null);
        setError(j?.error || "Location not found");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Load failed");
      // A new deploy is live: reload once so this screen runs the latest version
      if (json.data.version) {
        if (versionRef.current && versionRef.current !== json.data.version) {
          window.location.reload();
          return;
        }
        versionRef.current = json.data.version;
      }
      loadedOnceRef.current = true;
      setError(""); // clear any prior error on success
      setLocation(json.data.location);
      setAds(json.data.ads);
      setAdvertiseSlide(json.data.advertiseSlide ?? null);
    } catch {
      if (!loadedOnceRef.current) setError(RECONNECTING);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Remote setup: report in once a minute; if an admin assigned this screen to a location,
  // switch to that location's screen (works even from inside the Live Ads page)
  const locationSlugRef = useRef<string | null>(null);
  locationSlugRef.current = location?.slug ?? null;
  useEffect(() => {
    const check = () => {
      screenCheckin(`/display/${slug}`)
        .then((assigned) => {
          if (assigned && assigned !== slug && assigned !== locationSlugRef.current) goToScreen(assigned);
        })
        .catch(() => {});
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [slug]);

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

  // The slide chosen to show next: as it starts gliding in, its photo starts zooming and its
  // text reveal begins (each item delayed by REVEAL_START_MS), so the words land as it arrives
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => { emblaApi.off("select", onSelect); emblaApi.off("reInit", onSelect); };
  }, [emblaApi]);

  const motionFor = (idx: number): SlideMotion => (idx === selectedIndex ? "play" : "none");

  // Ad on screen right now (null on the "Advertise here" slide) — for the Save button in the controls
  const currentSlide = slides[selectedIndex];
  const currentAdId = currentSlide?.kind === "ad" ? currentSlide.ad.id : null;
  const currentAdTitle = currentSlide?.kind === "ad" ? currentSlide.ad.title : "";

  // Reinitialise Embla after slides change. If the slide it was on no longer exists
  // (e.g. ads were removed while the screen was open), go back to the first slide.
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    if (emblaApi.selectedScrollSnap() >= slides.length) emblaApi.scrollTo(0, true);
  }, [slides, emblaApi]);

  // Count a screen view each time a slide is actually shown. Data refreshes (polling every
  // 10 s, socket pushes) rebuild `slides` but must not re-count the slide already on screen.
  const slidesRef = useRef<Slide[]>([]);
  slidesRef.current = slides;
  const initialTrackedRef = useRef(false);

  const trackShownSlide = useCallback(() => {
    if (!emblaApi) return;
    const slide = slidesRef.current[emblaApi.selectedScrollSnap()];
    // The "Advertise here" slide is not an ad view; nor is the all-locations (website) screen
    if (slide?.kind !== "ad" || slug === "all") return;
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

  // First load: open on the ad named in ?ad= (from "View Live Display") if it's showing here;
  // otherwise start at the first slide. Either way the first slide shown counts once.
  useEffect(() => {
    if (initialTrackedRef.current || !emblaApi || slides.length === 0) return;
    initialTrackedRef.current = true;
    const focusAdId = new URLSearchParams(window.location.search).get("ad");
    const target = focusAdId ? slides.findIndex(s => s.kind === "ad" && s.ad.id === focusAdId) : -1;
    if (target > 0) {
      emblaApi.scrollTo(target, true); // instant jump; its "select" event records the view
      return;
    }
    trackShownSlide();
  }, [emblaApi, slides, trackShownSlide]);

  // Socket.io: join location room, refresh ads on push
  useDisplaySocket(slug, fetchAds);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cb-display-root" style={fullscreen("#0A1A2E")}>
        <div style={{ textAlign: "center", color: "#4A90C4" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
          <p style={{ fontSize: 18, letterSpacing: "0.1em" }}>Loading display…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error === RECONNECTING) {
    return (
      <div className="cb-display-root" style={fullscreen("#0A1A2E")}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, textAlign: "center", padding: 24 }}>
          <BrandMark size={64} className="ring-1 ring-white/15 rounded-[14px]" />
          <p style={{ fontSize: 20, color: "#fff", fontWeight: 600, margin: 0 }}>Connecting to CommunityBulletin…</p>
          <p style={{ fontSize: 14, color: "#9DC4E0", margin: 0 }}>This screen will start automatically in a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cb-display-root" style={fullscreen("#0A1A2E")}>
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
      <div className="cb-display-root" style={fullscreen("#0A1A2E")} onMouseMove={handleMouseMove} onTouchStart={handleMouseMove}>
        <FullscreenOverlay show={showControls} isFullscreen={isFullscreen} onToggle={toggleFullscreen} canFullscreen={canFullscreen} standalone={standalone} />
        {/* Header bar */}
        <HeaderBar locationName={location?.name ?? slug} storeNumber={location?.storeNumber ?? null} portrait={portrait || short} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64 }}>📋</div>
          <p style={{ fontSize: 22, color: "#4A90C4", letterSpacing: "0.05em" }}>No active ads at this time</p>
          <p style={{ fontSize: 14, color: "#2A4A6C" }}>Ads will appear here once approved</p>
        </div>
        <FooterBar priceCents={location?.pricePerRunCents} allLocations={location?.allLocations} portrait={portrait || short} />
      </div>
    );
  }

  // ── Carousel ─────────────────────────────────────────────────────────────────
  return (
    <div className="cb-display-root" style={fullscreen("#0A1A2E")} onMouseMove={handleMouseMove} onTouchStart={handleMouseMove}>
      <FullscreenOverlay show={showControls} isFullscreen={isFullscreen} onToggle={toggleFullscreen} canFullscreen={canFullscreen} standalone={standalone} currentAdId={currentAdId} currentAdTitle={currentAdTitle} storeName={location?.name} slug={slug} />
      <HeaderBar locationName={location?.name ?? slug} storeNumber={location?.storeNumber ?? null} portrait={portrait || short} />

      {/* Carousel */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }} ref={emblaRef}>
        <div style={{ display: "flex", height: "100%" }}>
          {slides.map((slide, idx) => {
            if (slide.kind === "promo") {
              return (
                <div key={slide.key} style={{ flex: "0 0 100%", minWidth: 0, height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
                  <AdvertiseHereSlide
                    headline={advertiseSlide!.headline}
                    subline={location?.allLocations
                      ? "Reach shoppers on in-store screens at local businesses near you"
                      : advertiseSlide!.subline.replace(/\{store\}/g, location?.name ?? "this store")}
                    reach={location?.dailyCustomers ? `~${location.dailyCustomers.toLocaleString("en-US")} shoppers a day` : null}
                    price={location?.pricePerRunCents ? formatPrice(location.pricePerRunCents) : null}
                    pricePrefix={location?.allLocations ? "From " : ""}
                    postUrl={typeof window === "undefined" ? "" : location?.allLocations
                      ? `${window.location.origin}/ads/new`
                      : `${window.location.origin}/ads/new?location=${encodeURIComponent(slug)}&src=screen`}
                    portrait={portrait} short={short} motion={motionFor(idx)}
                  />
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
                  <SplitAdSlide ad={ad} idx={idx} total={slides.length} portrait={portrait} short={short} zooming={idx === selectedIndex} motion={motionFor(idx)} />
                ) : (
                  /* Full-screen image layout */
                  <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0A1A2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* Portrait phone: fill the space around a wide image with a soft, darkened copy of it */}
                    {portrait && (
                      <img
                        src={ad.imageUrl}
                        alt=""
                        aria-hidden="true"
                        style={{
                          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                          filter: "blur(28px) brightness(0.45) saturate(1.2)", transform: "scale(1.2)",
                        }}
                      />
                    )}
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className={idx === selectedIndex ? "cb-kenburns-soft" : undefined}
                      style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain", display: "block" }}
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

      <FooterBar priceCents={location?.pricePerRunCents} allLocations={location?.allLocations} portrait={portrait || short} />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Built-in slide selling this screen's ad space; QR opens Post a New Ad with this store pre-selected

function fullscreen(bg: string): React.CSSProperties {
  return {
    width: "100vw",
    background: bg,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
  };
}

function HeaderBar({ locationName, storeNumber, portrait }: { locationName: string; storeNumber: string | null; portrait: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: portrait ? "10px 14px" : "14px 32px",
      background: "rgba(10,26,46,0.95)",
      borderBottom: "1px solid rgba(74,144,196,0.2)",
      zIndex: 20,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: portrait ? 8 : 12, minWidth: 0 }}>
        <a href="/" target="_top" style={{ textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            fontFamily: "Georgia,serif",
            fontSize: portrait ? 14 : 16,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.02em",
          }}>
            Community <span style={{ color: "#E8563A" }}>Bulletin</span>
            <span style={{ color: "#4A90C4", fontSize: 12 }}>.com</span>
          </div>
        </a>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ fontSize: portrait ? 12 : 13, color: "#9DC4E0", display: "flex", alignItems: "center", gap: 6, minWidth: 0, whiteSpace: "nowrap" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{locationName}</span>
          {storeNumber && (
            <>
              <span style={{ color: "#E8563A", fontWeight: 700 }}>#</span>
              <span style={{ color: "#E8563A", fontWeight: 700 }}>{storeNumber}</span>
            </>
          )}
        </div>
      </div>

      {/* Clock */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: portrait ? 17 : 22, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          <Clock />
        </div>
        {!portrait && (
          <div style={{ fontSize: 11, color: "#4A90C4" }}>
            <DateDisplay />
          </div>
        )}
      </div>
    </div>
  );
}

function SplitAdSlide({ ad, idx, total, portrait, short, zooming, motion }: { ad: Ad; idx: number; total: number; portrait: boolean; short: boolean; zooming: boolean; motion: SlideMotion }) {
  // Text rises in one item after another when this slide comes on screen
  const rise = motionClass(motion, "cb-rise");
  const len = ad.title.length;
  const titleSize = portrait
    ? (len <= 20 ? "33px" : len <= 40 ? "27px" : "22px")
    : short
    ? (len <= 20 ? "clamp(22px, 8vh, 36px)" : len <= 40 ? "clamp(19px, 6.5vh, 30px)" : "clamp(17px, 5.5vh, 26px)")
    : len <= 20
    ? "clamp(34px, 5vw, 74px)"
    : len <= 40
    ? "clamp(25px, 3.6vw, 54px)"
    : "clamp(19px, 2.7vw, 40px)";

  // The title gets the attention: its words rise in one by one, then a coral bar draws in under it;
  // the rest of the text follows once the title has landed
  const words = ad.title.trim().split(/\s+/);
  const WORD_STEP_MS = TITLE_WORD_STEP_MS;
  const titleDoneMs = REVEAL_START_MS + Math.min(words.length, 8) * WORD_STEP_MS + 450;
  const after = (ms: number) => `${titleDoneMs + ms}ms`;

  return (
    // Landscape: text left, image right. Portrait phone: image on top, text below.
    <div style={{ height: "100%", display: "flex", flexDirection: portrait ? "column-reverse" : "row", position: "relative" }}>
      {/* Text panel */}
      <div style={{
        width: portrait ? "100%" : "42%",
        background: "#0A1A2E",
        display: "flex",
        flexDirection: "column",
        justifyContent: portrait ? "flex-start" : "center",
        padding: portrait ? "18px 20px 22px" : short ? "12px 22px" : "clamp(20px, 4vw, 56px)",
        position: "relative",
        flex: portrait ? "1 1 auto" : undefined,
        flexShrink: portrait ? 1 : 0,
        minHeight: 0,
        overflowY: portrait ? "auto" : undefined,
        borderRight: portrait ? undefined : "1px solid rgba(74,144,196,0.15)",
        borderTop: portrait ? "1px solid rgba(74,144,196,0.15)" : undefined,
      }}>
        {/* Title — once every word has landed it "pops" (grows slightly and settles) to draw the eye */}
        <div className={motionClass(motion, "cb-pop")} style={{
          animationDelay: `${titleDoneMs}ms`,
          transformOrigin: "left center",
          fontFamily: "Georgia, serif",
          fontSize: titleSize,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.08,
          letterSpacing: "-0.01em",
          textShadow: "0 2px 14px rgba(0,0,0,0.35)",
        }}>
          {words.map((word, i) => (
            <span key={i}>
              <span
                className={motionClass(motion, "cb-word")}
                style={{ display: "inline-block", animationDelay: `${REVEAL_START_MS + Math.min(i, 7) * WORD_STEP_MS}ms` }}
              >
                {word}
              </span>
              {i < words.length - 1 && " "}
            </span>
          ))}
        </div>
        <div
          className={motionClass(motion, "cb-underline", "cb-hold-bar")}
          style={{
            animationDelay: `${titleDoneMs - 120}ms`,
            flexShrink: 0,
            width: portrait ? 52 : "clamp(52px, 5.5vw, 84px)",
            height: portrait ? 4 : "clamp(4px, 0.45vw, 6px)",
            background: "#E8563A",
            borderRadius: 3,
            marginTop: short ? 6 : "clamp(10px, 1.4vw, 18px)",
            marginBottom: short ? 8 : "clamp(12px, 1.8vw, 24px)",
          }}
        />

        {/* Description */}
        {ad.description && (
          <div className={rise} style={{
            animationDelay: after(0),
            fontSize: "clamp(12px, 1.3vw, 18px)",
            color: "rgba(255,255,255,0.65)",
            lineHeight: short ? 1.4 : 1.6,
            marginBottom: short ? 8 : "clamp(14px, 2vw, 28px)",
          }}>
            {ad.description}
          </div>
        )}

        {/* Accent divider + Contact Info label */}
        {!short && (ad.showPhone || ad.showAddress || ad.showWebsite) && (
          <>
            <div className={rise} style={{ animationDelay: after(100), fontSize: "clamp(9px, 0.85vw, 12px)", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "clamp(8px, 1vw, 14px)" }}>
              Contact Info
            </div>
          </>
        )}

        {/* Contact fields */}
        <div className={rise} style={{ animationDelay: after(160), display: "flex", flexDirection: "column", gap: short ? 4 : "clamp(8px, 1.2vw, 16px)" }}>
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
          <div className={rise} style={{ animationDelay: after(320), display: "flex", alignItems: "center", gap: portrait ? 14 : short ? 10 : "clamp(10px, 1.4vw, 20px)", marginTop: portrait ? 18 : short ? 8 : "clamp(16px, 2.4vw, 34px)" }}>
            <div style={{
              background: "#fff",
              borderRadius: "clamp(6px, 0.7vw, 10px)",
              padding: portrait ? 7 : "clamp(5px, 0.6vw, 9px)",
              width: portrait ? 116 : short ? "clamp(56px, 17vh, 76px)" : "clamp(84px, 9.5vw, 168px)",
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
              <div style={{ fontSize: portrait ? 16 : "clamp(12px, 1.3vw, 19px)", color: "#fff", fontWeight: 700, lineHeight: 1.25 }}>
                Scan to visit
              </div>
              <div style={{ fontSize: portrait ? 13 : "clamp(10px, 1vw, 14px)", color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                Point your phone camera here
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Image panel */}
      <div style={{ flex: portrait ? "0 0 44%" : 1, overflow: "hidden", position: "relative" }}>
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className={zooming ? "cb-kenburns" : undefined}
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

function FullscreenOverlay({ show: showFromActivity, isFullscreen, onToggle, canFullscreen, standalone, currentAdId, currentAdTitle, storeName, slug }: {
  show: boolean; isFullscreen: boolean; onToggle: () => void; canFullscreen: boolean; standalone: boolean;
  currentAdId?: string | null; currentAdTitle?: string; storeName?: string; slug?: string;
}) {
  const [showTip, setShowTip] = useState(false);
  // Keep the controls up while the share menu is open, even after the usual 4 s fade
  const [shareOpen, setShareOpen] = useState(false);
  const show = showFromActivity || shareOpen;
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
        {/* Save the ad on screen — only in these tap/hover controls, so store TVs never show it.
            After logging in, the viewer returns to this screen opened on the same ad. */}
        {currentAdId && slug && (
          <HeartButton adId={currentAdId} variant="screen" returnTo={`/display/${slug}?ad=${currentAdId}`} />
        )}

        {/* Share the ad on screen (its public ad page) */}
        {currentAdId && (
          <ShareButton
            adId={currentAdId}
            title={currentAdTitle ?? ""}
            text={storeName ? `At ${storeName}` : undefined}
            variant="screen"
            onOpenChange={setShareOpen}
          />
        )}

        {/* Home (target _top: leaves the Live Ads frame instead of loading the site inside it) */}
        <a
          href="/"
          target="_top"
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

function FooterBar({ priceCents, allLocations, portrait }: { priceCents?: number; allLocations?: boolean; portrait?: boolean }) {
  const price = priceCents ? `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}` : null;
  return (
    <div style={{
      padding: portrait ? "8px 14px" : "10px 32px",
      gap: 10,
      background: "rgba(10,26,46,0.95)",
      borderTop: "1px solid rgba(74,144,196,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
      zIndex: 20,
    }}>
      <p style={{ fontSize: 12, color: "#2A4A6C" }}>
        {allLocations ? "Advertise at local stores" : "Advertise at this location"} — <span style={{ color: "#4A90C4" }}>communitybulletin.com</span>
      </p>
      <p style={{ fontSize: 11, color: "#1A2A3C" }}>{price ? `${allLocations ? "From " : ""}${price} · ` : ""}4 weeks · No contracts</p>
    </div>
  );
}
