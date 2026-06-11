"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type LiveAd = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  contactPhone:   string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  showPhone:   boolean;
  showAddress: boolean;
  showWebsite: boolean;
  locationSlug: string;
  locationName: string;
  storeName: string;
  storeNumber: string | null;
  addressLine1: string;
  cityName: string;
  stateCode: string;
  postalCode: string;
  endedAt: string;
};

function AdCard({ ad }: { ad: LiveAd }) {
  const hasSplit = !!(ad.contactPhone || ad.contactAddress || ad.contactWebsite);
  const daysLeft = Math.max(0, Math.ceil((new Date(ad.endedAt).getTime() - Date.now()) / 86_400_000));
  const len = ad.title.length;
  const titleSize = len <= 20 ? 18 : len <= 40 ? 15 : 13;

  return (
    <Link
      href={`/ad/${ad.id}`}
      style={{ textDecoration: "none" }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #D8E4EE",
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(26,58,92,0.13)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: "relative", background: "#0A1A2E", height: 180, flexShrink: 0, overflow: "hidden" }}>
          {hasSplit ? (
            <div style={{ display: "flex", height: "100%" }}>
              {/* Mini left panel */}
              <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "12px 14px", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.15)", position: "relative" }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: titleSize, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>{ad.title}</div>
                {ad.description && (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {ad.description}
                  </div>
                )}
                {(ad.showPhone || ad.showAddress || ad.showWebsite) && (
                  <>
                    <div style={{ width: 22, height: 2, background: "#E8563A", borderRadius: 1, marginBottom: 6 }} />
                    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 5 }}>Contact Info</div>
                  </>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {ad.showPhone   && ad.contactPhone   && <div style={{ fontSize: 9, color: "#fff",     fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📞 {ad.contactPhone}</div>}
                  {ad.showAddress && ad.contactAddress && <div style={{ fontSize: 9, color: "#fff",     fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {ad.contactAddress}</div>}
                  {ad.showWebsite && ad.contactWebsite && <div style={{ fontSize: 9, color: "#4A90C4", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🌐 {ad.contactWebsite}</div>}
                </div>
              </div>
              {/* Right image */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <img src={ad.imageUrl} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </div>
          ) : (
            <>
              <img src={ad.imageUrl} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.7) 0%, transparent 40%)" }} />
            </>
          )}

          {/* Live badge */}
          <div style={{ position: "absolute", top: 10, left: 10, background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, background: "#fff", borderRadius: "50%", display: "inline-block" }} />
            LIVE
          </div>

          {/* Days left */}
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(10,26,46,0.75)", color: "rgba(255,255,255,0.8)", fontSize: 10, padding: "3px 8px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
            {daysLeft}d left
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Title (for full-screen layout; split layout shows it in thumbnail) */}
          {!hasSplit && (
            <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#1A3A5C", lineHeight: 1.3, marginBottom: 2 }}>
              {ad.title}
            </div>
          )}
          {!hasSplit && ad.description && (
            <div style={{ fontSize: 12, color: "#6B8FA8", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {ad.description}
            </div>
          )}

          {/* Location */}
          <div style={{ marginTop: hasSplit ? 0 : 4, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ fontSize: 12, marginTop: 1 }}>📍</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A5C" }}>
                {ad.locationName}
                {ad.storeNumber && <span style={{ color: "#E8563A", marginLeft: 4 }}>#{ad.storeNumber}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#6B8FA8" }}>
                {ad.addressLine1} · {ad.cityName}, {ad.stateCode} {ad.postalCode}
              </div>
            </div>
          </div>

          {/* Ad ID */}
          <div style={{ fontSize: 10, color: "#9DB8CC", marginTop: "auto", paddingTop: 6, borderTop: "1px solid #EDF2F7" }}>
            Ad #{ad.id.slice(-6).toUpperCase()}
          </div>
        </div>

        {/* CTA footer */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #EDF2F7", background: "#F7FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A3A5C" }}>View Ad Details</span>
          <span style={{ fontSize: 14, color: "#4A90C4" }}>→</span>
        </div>
      </div>
    </Link>
  );
}

export default function LiveAdsSection() {
  const [ads, setAds] = useState<LiveAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const fetchAds = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/ads/live?search=${encodeURIComponent(q)}` : "/api/ads/live";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setAds(json.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAds(debouncedSearch); }, [debouncedSearch, fetchAds]);

  return (
    <section id="live-ads" style={{ background: "#F4F7FB", padding: "56px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E8563A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
              Live right now
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, color: "#1A3A5C", margin: 0 }}>
              Currently running ads
            </h2>
          </div>
          {!loading && (
            <div style={{ fontSize: 13, color: "#6B8FA8" }}>
              {ads.length} ad{ads.length !== 1 ? "s" : ""} live
            </div>
          )}
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: 28, maxWidth: 520 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#9DB8CC", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by location, address, title, store #, or ad ID…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              border: "1px solid #D8E4EE",
              borderRadius: 10,
              fontSize: 14,
              color: "#1A3A5C",
              background: "#fff",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: "0 1px 4px rgba(26,58,92,0.06)",
            }}
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9DB8CC", fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #D8E4EE", height: 340, opacity: 0.6, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6B8FA8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A3A5C", marginBottom: 6 }}>
              {search ? "No ads match your search" : "No live ads at the moment"}
            </div>
            <div style={{ fontSize: 13 }}>
              {search ? "Try a different search term" : "Check back soon — new ads go live daily"}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}
      </div>
    </section>
  );
}
