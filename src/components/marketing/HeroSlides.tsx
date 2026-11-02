"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SaleTemplate } from "@/components/display/templates/SaleTemplate";
import { ADSEZ_FAMILY, SAMPLE_SALE_AD, SAMPLE_SALE_PHOTO } from "@/lib/house-content";

type LiveAd = { id: string; title: string; imageUrl: string; locationName: string | null; storeName: string; cityName: string; stateCode: string };

const ROTATE_MS = 7000;

/**
 * Home page hero slideshow: ads live right now (when there are any), a sample template ad,
 * our sister sites ("Part of the ADSEZ family") and "Your ad could be here".
 * Pauses on hover; no auto-rotation for visitors who prefer reduced motion.
 */
export default function HeroSlides({ price }: { price: string }) {
  const [live, setLive] = useState<LiveAd[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let cancelled = false;
    fetch("/api/ads/live")
      .then(r => r.json())
      .then(json => { if (!cancelled && json.success) setLive((json.data as LiveAd[]).filter(a => a.imageUrl).slice(0, 6)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const slides = [
    ...(live.length ? [{ key: "live", label: "Live now" }] : []),
    { key: "sample", label: "Sample ad" },
    { key: "family", label: "ADSEZ family" },
    { key: "yours", label: "Your ad" },
  ];
  const count = slides.length;
  const current = slides[index % count].key;

  useEffect(() => {
    if (reduced || paused) return;
    const t = setInterval(() => setIndex(i => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [reduced, paused, count]);

  return (
    <div
      className="w-full max-w-xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* TV frame */}
      <div className="bg-[#071520] rounded-xl p-1.5 shadow-[0_20px_56px_rgba(7,21,32,.45)] ring-1 ring-white/10">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-[#0D1F35]" aria-live="polite">
          {current === "live" && <LiveSlide ads={live} />}
          {current === "sample" && <SampleSlide />}
          {current === "family" && <FamilySlide />}
          {current === "yours" && <YoursSlide price={price} />}
        </div>
      </div>
      <div className="flex justify-center"><div className="w-16 h-1.5 bg-[#071520] rounded-b" /></div>

      {/* Slide picker */}
      <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Slides">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={i === index % count}
            aria-label={s.label}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 border-0 cursor-pointer ${i === index % count ? "w-6 bg-[#E8563A]" : "w-2 bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Pill({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "green" }) {
  return (
    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-[#0A1A2E]/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full">
      {tone === "green" && <span className="w-2 h-2 rounded-full bg-green-500 motion-safe:animate-pulse" />}
      {children}
    </div>
  );
}

// Real ads running right now (shown only when there are some)
function LiveSlide({ ads }: { ads: LiveAd[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % ads.length), 3500);
    return () => clearInterval(t);
  }, [ads.length]);
  const ad = ads[i % ads.length];
  return (
    <Link href="/live-ads" className="absolute inset-0 block no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.imageUrl} alt={ad.title} className="absolute inset-0 w-full h-full object-cover cb-kenburns" key={ad.id} />
      <Pill tone="green">Live now</Pill>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A1A2E]/90 to-transparent px-4 pt-8 pb-3 text-left">
        <div className="font-serif font-bold text-white text-sm sm:text-base line-clamp-1">{ad.title}</div>
        <div className="text-[11px] text-[#9DC4E0]">{ad.locationName || ad.storeName} · {ad.cityName}, {ad.stateCode}</div>
      </div>
    </Link>
  );
}

function SampleSlide() {
  return (
    <>
      <SaleTemplate data={SAMPLE_SALE_AD} photoUrl={SAMPLE_SALE_PHOTO} qrValue={null} address={null} phone={null} website={null} play />
      <Pill>Sample ad</Pill>
    </>
  );
}

function FamilySlide() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-[6%] py-[5%] text-left bg-[radial-gradient(120%_90%_at_20%_10%,#1D4570_0%,#0F2540_55%,#0A1A2E_100%)] cb-rise">
      <div className="text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#9DC4E0]">Part of the ADSEZ family</div>
      <div className="font-serif font-bold text-white text-base sm:text-xl leading-tight mt-1 mb-3">Community Bulletin&rsquo;s sister sites</div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {ADSEZ_FAMILY.map(f => (
          <div key={f.name} className="bg-white/5 border border-white/10 rounded-lg p-2 sm:p-3">
            <div className="text-[11px] sm:text-sm font-bold text-white truncate">{f.name}</div>
            <div className="text-[10px] sm:text-xs text-[#9DC4E0] mb-1">{f.what}</div>
            <div className="flex gap-3">
              {f.stats.map(([n, l]) => (
                <div key={l}>
                  <div className="font-serif font-bold text-[#E8563A] text-sm sm:text-xl leading-none">{n}</div>
                  <div className="text-[10px] text-[#9DC4E0]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px] sm:text-[11px] text-[#9DC4E0]/90 leading-snug mt-2 sm:mt-3 mb-0">
        Online users and listings across our sites, worldwide. Not Community Bulletin screen viewers or local store traffic.
      </p>
    </div>
  );
}

function YoursSlide({ price }: { price: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8%] bg-[linear-gradient(140deg,#1A3A5C,#0F2540)] cb-rise">
      <div className="text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#9DC4E0]">This spot is open</div>
      <div className="font-serif font-bold text-white text-xl sm:text-3xl leading-tight mt-1">Your ad could be here</div>
      <div className="h-1.5 w-20 bg-[#E8563A] rounded-full my-3 sm:my-4" />
      <div className="text-sm sm:text-lg text-white">From <strong className="text-[#E8563A]">{price}</strong> for 4 weeks</div>
      <div className="text-[11px] sm:text-sm text-[#9DC4E0] mt-1">No contracts · Full refund if not approved</div>
    </div>
  );
}
