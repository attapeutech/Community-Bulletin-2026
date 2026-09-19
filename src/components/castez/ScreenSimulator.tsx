"use client";

import { useEffect, useState } from "react";

type Slot = {
  eyebrow: string;
  eyebrowColor: string;
  line1: string;
  line2: string;
  badge: string;
  badgeBg: string;
  badgeFg: string;
  background: string;
};

const SLOTS: Slot[] = [
  {
    eyebrow: "MARIA'S TAQUERIA · 200 FT AWAY",
    eyebrowColor: "#5cf0dd",
    line1: "2 tacos + horchata",
    line2: "$7 til 4pm today",
    badge: "Show this screen at the counter",
    badgeBg: "#5cf0dd",
    badgeFg: "#04100e",
    background: "linear-gradient(150deg,#0f2f2b,#08131b)",
  },
  {
    eyebrow: "NORTHSIDE DENTAL · NOW BOOKING",
    eyebrowColor: "#9db0ff",
    line1: "New patient cleaning",
    line2: "$59 this month",
    badge: "Walk-ins after 5pm",
    badgeBg: "#8ea6ff",
    badgeFg: "#0a0b16",
    background: "linear-gradient(150deg,#141a3a,#0a0b16)",
  },
  {
    eyebrow: "RIDGE HOME SERVICES · LICENSED",
    eyebrowColor: "#f0b07e",
    line1: "Gutter cleanout",
    line2: "before the rain hits",
    badge: "Same-week slots open",
    badgeBg: "#f0b07e",
    badgeFg: "#150c08",
    background: "linear-gradient(150deg,#2a1c10,#150c08)",
  },
];

export function ScreenSimulator({
  liveRotation = true,
  rotationSeconds = 4,
}: {
  liveRotation?: boolean;
  rotationSeconds?: number;
}) {
  const [slot, setSlot] = useState(0);

  useEffect(() => {
    if (!liveRotation) return;
    // Honour the OS reduced-motion setting: hold on the first slot instead of cycling.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setSlot((s) => (s + 1) % SLOTS.length), rotationSeconds * 1000);
    return () => clearInterval(id);
  }, [liveRotation, rotationSeconds]);

  return (
    <div className="relative min-w-0">
      {/* Bloom behind the panel */}
      <div className="absolute inset-[14px] rounded-[26px] bg-[linear-gradient(140deg,rgba(62,230,209,.35),rgba(79,124,255,.25))] blur-[40px]" />

      <div
        className="relative rounded-[22px] border border-ce-line4 bg-ce-surface/[0.72] p-4 backdrop-blur-[20px]"
        style={{ boxShadow: "0 40px 80px -40px rgba(0,0,0,.9)" }}
      >
        <div className="flex items-center justify-between px-1.5 pb-3.5 pt-1">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-ce-accent"
              style={{ boxShadow: "0 0 10px #3ee6d1" }}
            />
            <span className="font-ce-mono text-[11px] tracking-[0.06em] text-ce-muted">
              SCREEN #0412 · 7TH &amp; MARKET
            </span>
          </div>
          <span className="font-ce-mono text-[11px] text-ce-muted4">1080p · 24/7</span>
        </div>

        <div className="rounded-[14px] border border-ce-line6 bg-ce-screen p-[9px]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[9px] bg-ce-slot">
            <div
              className="absolute inset-0 transition-transform duration-[850ms] ease-[cubic-bezier(.65,.05,.36,1)]"
              style={{ transform: `translateY(-${slot * 100}%)` }}
            >
              {SLOTS.map((s) => (
                <div
                  key={s.eyebrow}
                  className="flex h-full flex-col justify-between p-[26px]"
                  style={{ background: s.background }}
                >
                  <div
                    className="font-ce-mono text-[11px] tracking-[0.16em]"
                    style={{ color: s.eyebrowColor }}
                  >
                    {s.eyebrow}
                  </div>
                  <div>
                    <div className="font-ce-display text-[clamp(22px,3.4vw,36px)] font-bold leading-[1.05] tracking-[-0.035em]">
                      {s.line1}
                      <br />
                      {s.line2}
                    </div>
                    <div
                      className="mt-3 inline-block rounded-[7px] px-3 py-1.5 text-[13px] font-bold"
                      style={{ background: s.badgeBg, color: s.badgeFg }}
                    >
                      {s.badge}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#141821]">
              <div
                className="h-full bg-[linear-gradient(90deg,#3ee6d1,#7c9dff)] transition-[width] duration-300 ease-linear"
                style={{ width: `${((slot + 1) / SLOTS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 rounded-[9px] border border-ce-accent/30 bg-ce-accent/[0.08] px-3 py-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ce-accent text-[10px] font-extrabold text-ce-onAccent">
              ✓
            </span>
            <span className="font-ce-mono text-[11px] tracking-[0.03em] text-ce-accentLight">
              Approved by Store Manager • Active via Socket.io
            </span>
          </div>
          <span className="font-ce-mono text-[11px] text-ce-muted4">
            SLOT 0{slot + 1} / 0{SLOTS.length}
          </span>
        </div>
      </div>
    </div>
  );
}
