"use client";

import { useState, useEffect } from "react";

type Props = {
  imageUrl: string;
  title: string;
  storeName: string;
  cityName: string;
  addressLine1: string;
  adId: string;
};

export default function AdImagePreview({ imageUrl, title, storeName, cityName, addressLine1, adId }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!showPreview) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowPreview(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPreview]);

  return (
    <>
      {/* Clickable image with hover overlay */}
      <div
        onClick={() => setShowPreview(true)}
        style={{ background: "#0A1A2E", borderRadius: 12, overflow: "hidden", marginBottom: 24, position: "relative", cursor: "pointer" }}
      >
        <img
          src={imageUrl}
          alt={title}
          style={{ width: "100%", maxHeight: 380, objectFit: "contain", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 25%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
            Store Location: {storeName} — {cityName} ({addressLine1})
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", marginLeft: 12 }}>
            Ad #{adId.slice(-6).toUpperCase()}
          </span>
        </div>
        {/* Hover hint */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(10,26,46,0.7)",
          color: "rgba(255,255,255,0.8)",
          fontSize: 12, padding: "4px 10px", borderRadius: 6,
          backdropFilter: "blur(4px)",
        }}>
          ⛶ Preview on display screen
        </div>
      </div>

      {/* Display screen preview modal */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(90vw, 1100px)",
              maxHeight: "80vh",
              background: "#0A1A2E",
              borderRadius: 12,
              overflow: "hidden",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 8px #1a1a1a, 0 0 0 12px #333, 0 24px 48px rgba(0,0,0,0.8)",
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", maxHeight: "80vh" }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 18%)",
            }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "16px 32px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: "clamp(11px, 1.4vw, 18px)",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500, letterSpacing: "0.01em",
              }}>
                Store Location: {storeName} — {cityName} ({addressLine1})
              </span>
              <span style={{
                fontSize: "clamp(10px, 1.2vw, 15px)",
                color: "rgba(255,255,255,0.6)",
                whiteSpace: "nowrap", marginLeft: 24,
              }}>
                Ad #{adId.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 20 }}>
            This is how your ad appears on the in-store display screen · Click anywhere or press Esc to close
          </p>
        </div>
      )}
    </>
  );
}
