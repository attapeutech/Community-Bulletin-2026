"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useDisplaySocket } from "@/lib/socket/client";

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

type LocationInfo = {
  slug: string;
  name: string;
  storeName: string;
  storeNumber: string | null;
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

export default function DisplayPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.requestFullscreen().catch(() => {});
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function handleMouseMove() {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
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

  // Reinitialise Embla after ads change
  useEffect(() => {
    emblaApi?.reInit();
  }, [ads, emblaApi]);

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
  if (ads.length === 0) {
    return (
      <div style={fullscreen("#0A1A2E")} onMouseMove={handleMouseMove}>
        <FullscreenOverlay show={showControls} isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
        {/* Header bar */}
        <HeaderBar locationName={location?.name ?? slug} storeNumber={location?.storeNumber ?? null} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64 }}>📋</div>
          <p style={{ fontSize: 22, color: "#4A90C4", letterSpacing: "0.05em" }}>No active ads at this time</p>
          <p style={{ fontSize: 14, color: "#2A4A6C" }}>Ads will appear here once approved</p>
        </div>
        <FooterBar />
      </div>
    );
  }

  // ── Carousel ─────────────────────────────────────────────────────────────────
  return (
    <div style={fullscreen("#0A1A2E")} onMouseMove={handleMouseMove}>
      <FullscreenOverlay show={showControls} isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
      <HeaderBar locationName={location?.name ?? slug} storeNumber={location?.storeNumber ?? null} />

      {/* Carousel */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }} ref={emblaRef}>
        <div style={{ display: "flex", height: "100%" }}>
          {ads.map((ad, idx) => (
            <div
              key={ad.id}
              style={{
                flex: "0 0 100%",
                minWidth: 0,
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Full image — dark background, no crop */}
              <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0A1A2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                {/* Subtle bottom gradient for the info bar */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(10,26,46,0.85) 0%, transparent 22%)",
                }} />

                {/* Contact info bar — shown only when fields are toggled on */}
                {(ad.showPhone || ad.showAddress || ad.showWebsite) && (
                  <div style={{
                    position: "absolute",
                    bottom: 48, left: 0, right: 0,
                    padding: "10px 32px",
                    display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
                  }}>
                    {ad.showPhone && ad.contactPhone && (
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "clamp(12px, 1.5vw, 20px)", color: "#fff", fontWeight: 600 }}>
                        <span style={{ fontSize: "clamp(14px, 1.6vw, 22px)" }}>📞</span> {ad.contactPhone}
                      </span>
                    )}
                    {ad.showAddress && ad.contactAddress && (
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "clamp(12px, 1.5vw, 20px)", color: "#fff", fontWeight: 600 }}>
                        <span style={{ fontSize: "clamp(14px, 1.6vw, 22px)" }}>📍</span> {ad.contactAddress}
                      </span>
                    )}
                    {ad.showWebsite && ad.contactWebsite && (
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "clamp(12px, 1.5vw, 20px)", color: "#4A90C4", fontWeight: 600 }}>
                        <span style={{ fontSize: "clamp(14px, 1.6vw, 22px)" }}>🌐</span> {ad.contactWebsite}
                      </span>
                    )}
                  </div>
                )}

                {/* Location info bar */}
                <div style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0,
                  padding: "10px 32px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{
                    fontSize: "clamp(11px, 1.4vw, 18px)",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  }}>
                    {location?.storeName} — {location?.address}{location?.address2 ? `, ${location.address2}` : ""}, {location?.city}, {location?.stateCode} {location?.postalCode}
                  </span>
                  <span style={{
                    fontSize: "clamp(10px, 1.2vw, 15px)",
                    color: "rgba(255,255,255,0.6)",
                    whiteSpace: "nowrap",
                    marginLeft: 24,
                  }}>
                    Ad #{ad.id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Slide counter */}
              <div style={{
                position: "absolute",
                top: 20,
                right: 24,
                background: "rgba(10,26,46,0.6)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                padding: "4px 12px",
                borderRadius: 20,
                backdropFilter: "blur(4px)",
              }}>
                {idx + 1} / {ads.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {ads.length > 1 && (
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
          {ads.map((_, i) => (
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

      <FooterBar />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function FullscreenOverlay({ show, isFullscreen, onToggle }: { show: boolean; isFullscreen: boolean; onToggle: () => void }) {
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

        {/* Fullscreen toggle */}
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
      </div>
    </div>
  );
}

function FooterBar() {
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
      <p style={{ fontSize: 11, color: "#1A2A3C" }}>$100 · 1 week · No contracts</p>
    </div>
  );
}
