"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LiveAd = {
  id: string;
  title: string;
  imageUrl: string;
  locationSlug: string;
  locationName: string;
  cityName: string;
  stateCode: string;
};

const ROTATE_MS = 4500;
const MAX_ADS = 8;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Home page hero: a mini store screen cycling through ads that are live right now,
// plus a live count. Falls back to an illustrative placeholder when nothing is running.
export default function HeroScreen() {
  const [ads, setAds] = useState<LiveAd[] | null>(null);
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ads/live")
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        setAds(json.success ? (json.data as LiveAd[]).filter(a => a.imageUrl) : []);
      })
      .catch(() => !cancelled && setAds([]));
    return () => { cancelled = true; };
  }, []);

  const shown = ads?.slice(0, MAX_ADS) ?? [];
  const storeCount = new Set(ads?.map(a => a.locationSlug)).size;

  // Rotate (paused for visitors who prefer reduced motion)
  useEffect(() => {
    if (reducedMotion || shown.length < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % shown.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [reducedMotion, shown.length]);

  const current = shown[index % Math.max(shown.length, 1)];

  return (
    <div className="mt-16 max-w-lg mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
        {/* TV frame */}
        <Link
          href="/live-ads"
          aria-label="See all live ads"
          className="block bg-[#0D1B2A] rounded-xl p-1 mb-2 no-underline group"
        >
          <div className="relative rounded-lg overflow-hidden aspect-video bg-[#0F3557]">
            {shown.length > 0 ? (
              <>
                {shown.map((ad, i) => (
                  <img
                    key={ad.id}
                    src={ad.imageUrl}
                    alt={ad.title}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === index % shown.length ? "cb-kenburns" : ""}`}
                    style={{ opacity: i === index % shown.length ? 1 : 0 }}
                  />
                ))}
                {/* Title strip */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A1A2E]/90 via-[#0A1A2E]/50 to-transparent px-4 pt-8 pb-3 text-left">
                  <div className="font-serif font-bold text-white text-sm sm:text-base leading-snug line-clamp-1">
                    {current?.title}
                  </div>
                </div>
                {/* LIVE pill */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-[#0A1A2E]/75 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  LIVE
                </div>
                {/* Progress dots */}
                {shown.length > 1 && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    {shown.map((ad, i) => (
                      <span
                        key={ad.id}
                        className={`h-1.5 rounded-full transition-all duration-500 ${i === index % shown.length ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <PlaceholderAd loading={ads === null} />
            )}
          </div>
        </Link>

        {/* Stand */}
        <div className="flex justify-center">
          <div className="w-14 h-1.5 bg-white/10 rounded" />
        </div>

        <p className="text-[#9DC4E0] text-xs mt-2.5 text-center min-h-[1rem]">
          {current
            ? <>Now showing at <strong className="text-white font-semibold">{current.locationName}</strong> · {current.cityName}, {current.stateCode}</>
            : "Your ad displays like this on screens inside stores"}
        </p>
      </div>

      {/* Live stat */}
      {ads && ads.length > 0 && (
        <Link href="/live-ads" className="no-underline mt-4 inline-flex items-center gap-2 text-sm text-[#9DC4E0] hover:text-white transition-colors">
          <span className="w-2 h-2 rounded-full bg-green-500 motion-safe:animate-pulse" />
          <span>
            <strong className="text-white">{ads.length} ad{ads.length !== 1 ? "s" : ""} live</strong>
            {" "}across <strong className="text-white">{storeCount} store{storeCount !== 1 ? "s" : ""}</strong> right now →
          </span>
        </Link>
      )}
    </div>
  );
}

// Shown while loading or when no ads are running
function PlaceholderAd({ loading }: { loading: boolean }) {
  return (
    <div className="absolute inset-0 px-6 py-5 flex flex-col justify-center gap-2.5 text-left">
      <div className="flex justify-between items-center">
        <div className={`bg-[#4A90C4] rounded h-2.5 w-[45%] opacity-90 ${loading ? "motion-safe:animate-pulse" : ""}`} />
        <div className="w-2 h-2 rounded-full bg-[#E8563A] motion-safe:animate-pulse" />
      </div>
      <div className={`bg-[#7DB8DC] rounded h-1.5 w-[70%] opacity-60 ${loading ? "motion-safe:animate-pulse" : ""}`} />
      <div className={`bg-[#7DB8DC] rounded h-1.5 w-[55%] opacity-45 ${loading ? "motion-safe:animate-pulse" : ""}`} />
      <div className="flex gap-2 mt-1">
        <div className="bg-[#E8563A] rounded w-20 h-7 opacity-90 flex items-center justify-center">
          <span className="text-white text-[9px] font-bold">LEARN MORE</span>
        </div>
      </div>
    </div>
  );
}
