"use client";

import { useEffect, useState } from "react";

/** Frames-per-second readout for checking a screen's hardware (shown with ?fps on a display page) */
export function FpsMeter() {
  const [text, setText] = useState("…");
  useEffect(() => {
    let frames = 0, last = performance.now(), low = Infinity, raf = 0;
    const start = last;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 1000) {
        const fps = Math.round((frames * 1000) / (t - last));
        if (t - start > 2000) low = Math.min(low, fps); // ignore page load
        setText(`${fps} fps · low ${low === Infinity ? "–" : low}`);
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{
      position: "fixed", right: 10, bottom: 10, zIndex: 60, pointerEvents: "none",
      font: "600 13px/1 ui-monospace, Consolas, monospace", color: "#6EE7A0",
      background: "rgba(0,0,0,0.75)", padding: "7px 9px", borderRadius: 6,
    }}>
      {text}
    </div>
  );
}
