"use client";

import { useEffect } from "react";

/**
 * Full-screen view of the all-locations display (/display/all) — the same screen the stores run.
 * It shows "Your ad could be here" while nothing is live and starts sliding through paid ads
 * on its own as soon as any go live.
 */
export function AdvertiseFullscreen({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // Keep the page behind from scrolling; Escape closes
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Live display" style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0A1A2E" }}>
      <iframe
        src="/display/all"
        title="Live display"
        allow="fullscreen"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
      <button
        type="button"
        onClick={onClose}
        style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(10,26,46,0.85)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(4px)" }}
      >
        ✕ Close
      </button>
    </div>
  );
}
