"use client";

import { useEffect, useState } from "react";

const ADS = [
  {
    kicker: "MARIA'S TAQUERIA · 200 FT AWAY",
    headline: ["2 tacos + horchata", "$7 til 4pm today"],
    cta: "Show this screen at the counter",
    bg: "bg-[linear-gradient(150deg,#0f2f2b,#08131b)]",
    kickerColor: "text-[#5cf0dd]",
    pill: "bg-[#5cf0dd] text-[#04100e]",
  },
  {
    kicker: "NORTHSIDE DENTAL · NOW BOOKING",
    headline: ["New patient cleaning", "$59 this month"],
    cta: "Walk-ins after 5pm",
    bg: "bg-[linear-gradient(150deg,#141a3a,#0a0b16)]",
    kickerColor: "text-[#9db0ff]",
    pill: "bg-[#8ea6ff] text-[#0a0b16]",
  },
  {
    kicker: "RIDGE HOME SERVICES · LICENSED",
    headline: ["Gutter cleanout", "before the rain hits"],
    cta: "Same-week slots open",
    bg: "bg-[linear-gradient(150deg,#2a1c10,#150c08)]",
    kickerColor: "text-[#f0b07e]",
    pill: "bg-[#f0b07e] text-[#150c08]",
  },
];

export default function ScreenSimulation({ rotationSeconds = 4 }: { rotationSeconds?: number }) {
  const [slot, setSlot] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlot((s) => (s + 1) % ADS.length), rotationSeconds * 1000);
    return () => clearInterval(id);
  }, [rotationSeconds]);

  return (
    <div className="relative min-w-0">
      <div className="absolute inset-3.5 rounded-[26px] bg-gradient-to-br from-emerald-300/35 to-indigo-500/25 blur-[40px]" />
      <div className="relative rounded-[22px] border border-zinc-800 bg-[#0d0f13]/70 p-4 shadow-panel backdrop-blur-xl">
        <div className="flex items-center justify-between px-1.5 pb-3.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#3ee6d1]" />
            <span className="font-mono text-[11px] tracking-wider text-zinc-400">SCREEN #0412 · 7TH &amp; MARKET</span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">1080p · 24/7</span>
        </div>

        <div className="rounded-[14px] border border-zinc-700/70 bg-[#05060a] p-2.5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[9px] bg-[#0a0c11]">
            <div
              className="absolute inset-0 transition-transform duration-[850ms] ease-[cubic-bezier(.65,.05,.36,1)]"
              style={{ transform: `translateY(-${slot * 100}%)` }}
            >
              {ADS.map((ad) => (
                <div key={ad.kicker} className={`flex h-full flex-col justify-between p-6 ${ad.bg}`}>
                  <div className={`font-mono text-[11px] tracking-[0.16em] ${ad.kickerColor}`}>{ad.kicker}</div>
                  <div>
                    <div className="font-display text-[clamp(22px,3.4vw,36px)] font-bold leading-[1.05] tracking-tight">
                      {ad.headline[0]}
                      <br />
                      {ad.headline[1]}
                    </div>
                    <div className={`mt-3 inline-block rounded-[7px] px-3 py-1.5 text-[13px] font-bold ${ad.pill}`}>{ad.cta}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#141821]">
              <div
                className="h-full bg-gradient-to-r from-emerald-300 to-indigo-400 transition-[width] duration-300 ease-linear"
                style={{ width: `${((slot + 1) / ADS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 rounded-[9px] border border-emerald-300/30 bg-emerald-300/[0.08] px-3 py-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-300 text-[10px] font-extrabold text-[#04100e]">✓</span>
            <span className="font-mono text-[11px] text-emerald-200">Approved by Store Manager • Active via Socket.io</span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">SLOT 0{slot + 1} / 0{ADS.length}</span>
        </div>
      </div>
    </div>
  );
}
