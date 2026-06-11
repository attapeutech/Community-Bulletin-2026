"use client";

import { useState, useEffect } from "react";

type Props = {
  imageUrl: string;
  title: string;
  description: string | null;
  adId: string;
  locationSlug: string;
  contactPhone:   string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  showPhone:   boolean;
  showAddress: boolean;
  showWebsite: boolean;
};

export default function PublicAdPreview({
  imageUrl, title, description, adId,
  contactPhone, contactAddress, contactWebsite,
  showPhone, showAddress, showWebsite,
}: Props) {
  const hasSplit = !!(contactPhone || contactAddress || contactWebsite);
  const [showModal, setShowModal] = useState(false);

  const len = title.length;
  const titleSizeSm = len <= 20 ? "clamp(18px, 2.5vw, 34px)" : len <= 40 ? "clamp(14px, 1.8vw, 24px)" : "clamp(12px, 1.4vw, 18px)";
  const titleSizeLg = len <= 20 ? "clamp(28px, 4vw, 58px)" : len <= 40 ? "clamp(20px, 2.8vw, 42px)" : "clamp(15px, 2vw, 30px)";

  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showModal]);

  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={() => setShowModal(true)}
        style={{ background: "#0A1A2E", borderRadius: 12, overflow: "hidden", marginBottom: 24, position: "relative", cursor: "pointer" }}
      >
        {hasSplit ? (
          <div style={{ display: "flex", height: 340 }}>
            {/* Left panel */}
            <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(16px, 3vw, 40px)", position: "relative", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.15)" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: titleSizeSm, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 10 }}>{title}</div>
              {description && <div style={{ fontSize: "clamp(11px, 1.1vw, 14px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 12 }}>{description}</div>}
              {(showPhone || showAddress || showWebsite) && (
                <>
                  <div style={{ width: 28, height: 2, background: "#E8563A", borderRadius: 1, marginBottom: 8 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>Contact Info</div>
                </>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {showPhone && contactPhone && (
                  <a href={`tel:${contactPhone}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#fff", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    📞 {contactPhone}
                  </a>
                )}
                {showAddress && contactAddress && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(contactAddress)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#fff", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    📍 {contactAddress}
                  </a>
                )}
                {showWebsite && contactWebsite && (
                  <a
                    href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#4A90C4", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    🌐 {contactWebsite}
                  </a>
                )}
              </div>
            </div>
            {/* Right image */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <img src={imageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>
        ) : (
          <>
            <img src={imageUrl} alt={title} style={{ width: "100%", maxHeight: 380, objectFit: "contain", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.7) 0%, transparent 30%)", pointerEvents: "none" }} />
          </>
        )}

        {/* Ad # */}
        <div style={{ position: "absolute", bottom: 10, right: 16, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          Ad #{adId.slice(-6).toUpperCase()}
        </div>

        {/* Hover hint */}
        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(10,26,46,0.75)", color: "rgba(255,255,255,0.85)", fontSize: 12, padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(4px)" }}>
          ⛶ Preview on display screen
        </div>
      </div>

      {/* Fullscreen preview modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(90vw, 1100px)", height: "min(56vw, 620px)",
              background: "#0A1A2E", borderRadius: 12, overflow: "hidden",
              position: "relative", display: "flex",
              boxShadow: "0 0 0 8px #1a1a1a, 0 0 0 12px #333, 0 24px 48px rgba(0,0,0,0.8)",
            }}
          >
            {hasSplit ? (
              <>
                <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(20px, 4vw, 52px)", position: "relative", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.15)" }}>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: titleSizeLg, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: "clamp(10px, 1.5vw, 20px)" }}>{title}</div>
                  {description && <div style={{ fontSize: "clamp(11px, 1.2vw, 17px)", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: "clamp(12px, 1.8vw, 24px)" }}>{description}</div>}
                  {(showPhone || showAddress || showWebsite) && (
                    <>
                      <div style={{ width: 40, height: 3, background: "#E8563A", borderRadius: 2, marginBottom: "clamp(8px, 1.2vw, 16px)" }} />
                      <div style={{ fontSize: "clamp(9px, 0.8vw, 11px)", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "clamp(8px, 1vw, 14px)" }}>Contact Info</div>
                    </>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 14px)" }}>
                    {showPhone && contactPhone && (
                      <a href={`tel:${contactPhone}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "clamp(12px, 1.3vw, 18px)", color: "#fff", fontWeight: 600, textDecoration: "none" }}>
                        📞 {contactPhone}
                      </a>
                    )}
                    {showAddress && contactAddress && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(contactAddress)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "clamp(12px, 1.3vw, 18px)", color: "#fff", fontWeight: 600, textDecoration: "none" }}>
                        📍 {contactAddress}
                      </a>
                    )}
                    {showWebsite && contactWebsite && (
                      <a href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "clamp(12px, 1.3vw, 18px)", color: "#4A90C4", fontWeight: 600, textDecoration: "none" }}>
                        🌐 {contactWebsite}
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <img src={imageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ position: "absolute", bottom: 12, right: 20, fontSize: "clamp(10px, 0.9vw, 13px)", color: "rgba(255,255,255,0.35)" }}>
                  Ad #{adId.slice(-6).toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <img src={imageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 18%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 32px", display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "clamp(10px, 1.2vw, 15px)", color: "rgba(255,255,255,0.6)" }}>Ad #{adId.slice(-6).toUpperCase()}</span>
                </div>
              </>
            )}
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 20 }}>
            This is how the ad appears on the in-store display screen · Click anywhere or press Esc to close
          </p>
        </div>
      )}
    </>
  );
}
