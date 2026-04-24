"use client";

import { useEffect, useState, useCallback } from "react";
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
};

type LocationInfo = {
  slug: string;
  name: string;
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
      <div style={fullscreen("#0A1A2E")}>
        {/* Header bar */}
        <HeaderBar locationName={location?.name ?? slug} />
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
    <div style={fullscreen("#0A1A2E")}>
      <HeaderBar locationName={location?.name ?? slug} />

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
              {/* Full-bleed image */}
              <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Gradient overlay for text legibility */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(10,26,46,0.85) 0%, rgba(10,26,46,0.1) 60%, transparent 100%)",
                }} />

                {/* Ad text */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "32px 48px",
                }}>
                  <h2 style={{
                    fontFamily: "Georgia,serif",
                    fontSize: "clamp(28px, 4vw, 56px)",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                    textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  }}>
                    {ad.title}
                  </h2>
                  {ad.description && (
                    <p style={{
                      fontSize: "clamp(14px, 2vw, 22px)",
                      color: "rgba(255,255,255,0.85)",
                      maxWidth: 700,
                      lineHeight: 1.4,
                    }}>
                      {ad.description}
                    </p>
                  )}
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

function HeaderBar({ locationName }: { locationName: string }) {
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
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ fontSize: 13, color: "#9DC4E0" }}>{locationName}</div>
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
