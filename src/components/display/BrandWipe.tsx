"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import gsap from "gsap";

export type BrandWipeHandle = {
  /** Sweep coral across the slide area, call onCovered while it's hidden, then reveal the next slide */
  play: (onCovered: () => void) => void;
};

/**
 * The new design's signature transition between slides: a coral panel sweeps across, the CB mark
 * flips in its centre, and the next slide is revealed. Screens set to reduce motion skip it.
 */
export const BrandWipe = forwardRef<BrandWipeHandle>(function BrandWipe(_props, ref) {
  const panel = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const running = useRef<gsap.core.Timeline | null>(null);

  useImperativeHandle(ref, () => ({
    play(onCovered) {
      const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !panel.current || !mark.current) { onCovered(); return; }
      running.current?.progress(1); // finish any sweep still running before starting another
      running.current = gsap.timeline()
        .set(panel.current, { xPercent: -101, visibility: "visible" })
        .set(mark.current, { rotationY: 0, scale: 0.7, opacity: 0 })
        .to(panel.current, { xPercent: 0, duration: 0.42, ease: "power3.in" })
        .to(mark.current, { opacity: 1, scale: 1, rotationY: 180, duration: 0.5, ease: "power2.inOut" }, "-=0.1")
        .call(onCovered)
        .to(panel.current, { xPercent: 101, duration: 0.45, ease: "power3.out" }, "+=0.08")
        .set(panel.current, { visibility: "hidden" });
    },
  }), []);

  return (
    <div
      ref={panel}
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0, zIndex: 15, visibility: "hidden", pointerEvents: "none",
        background: "#E8563A", display: "grid", placeItems: "center", perspective: 800,
      }}
    >
      <div ref={mark} style={{ width: "min(22vh, 22vw)", height: "min(22vh, 22vw)" }}>
        <svg viewBox="0 0 512 512" width="100%" height="100%">
          <rect width="512" height="512" rx="112" fill="#fff" />
          <text x="256" y="350" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="290" letterSpacing="-12">
            <tspan fill="#1A3A5C">C</tspan>
            <tspan fill="#E8563A">B</tspan>
          </text>
        </svg>
      </div>
    </div>
  );
});
