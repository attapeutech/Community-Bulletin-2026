"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

export type LiveAd = {
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
    <Link href={`/ad/${ad.id}`} style={{ textDecoration: "none", display: "flex", height: "100%" }}>
      <div
        style={{ background: "#fff", borderRadius: 14, border: "1px solid #D8E4EE", overflow: "hidden", width: "100%", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s, transform 0.2s" }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "0 8px 32px rgba(26,58,92,0.13)"; el.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
      >
        {/* Thumbnail */}
        <div style={{ position: "relative", background: "#0A1A2E", height: 180, flexShrink: 0, overflow: "hidden" }}>
          {hasSplit ? (
            <div style={{ display: "flex", height: "100%" }}>
              <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "12px 14px", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.15)", position: "relative" }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: titleSize, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>{ad.title}</div>
                {ad.description && (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.4, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {ad.description}
                  </div>
                )}
                {(ad.showPhone || ad.showAddress || ad.showWebsite) && (
                  <>
                    <div style={{ width: 22, height: 2, background: "#E8563A", borderRadius: 1, marginBottom: 6 }} />
                    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 5 }}>Contact</div>
                  </>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {ad.showPhone   && ad.contactPhone   && <div style={{ fontSize: 9, color: "#fff",     fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📞 {ad.contactPhone}</div>}
                  {ad.showAddress && ad.contactAddress && <div style={{ fontSize: 9, color: "#fff",     fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {ad.contactAddress}</div>}
                  {ad.showWebsite && ad.contactWebsite && <div style={{ fontSize: 9, color: "#4A90C4", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🌐 {ad.contactWebsite}</div>}
                </div>
              </div>
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
          {/* Badges */}
          <div style={{ position: "absolute", top: 10, left: 10, background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, background: "#fff", borderRadius: "50%", display: "inline-block" }} /> LIVE
          </div>
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(10,26,46,0.75)", color: "rgba(255,255,255,0.8)", fontSize: 10, padding: "3px 8px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
            {daysLeft}d left
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {!hasSplit && (
            <>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#1A3A5C", lineHeight: 1.3 }}>{ad.title}</div>
              {ad.description && (
                <div style={{ fontSize: 12, color: "#6B8FA8", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{ad.description}</div>
              )}
            </>
          )}
          <div style={{ marginTop: hasSplit ? 0 : 4, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ fontSize: 12, marginTop: 1 }}>📍</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A5C" }}>
                {ad.locationName}{ad.storeNumber && <span style={{ color: "#E8563A", marginLeft: 4 }}>#{ad.storeNumber}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#6B8FA8" }}>{ad.cityName}, {ad.stateCode}</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#9DB8CC", marginTop: "auto", paddingTop: 6, borderTop: "1px solid #EDF2F7" }}>
            Ad #{ad.id.slice(-6).toUpperCase()}
          </div>
        </div>

        <div style={{ padding: "10px 16px", borderTop: "1px solid #EDF2F7", background: "#F7FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A3A5C" }}>View Ad Details</span>
          <span style={{ fontSize: 14, color: "#4A90C4" }}>→</span>
        </div>
      </div>
    </Link>
  );
}

type Props = {
  state?: string;
  city?: string;
  search?: string;
  limit?: number;
};

export default function LiveAdsGrid({ state = "", city = "", search = "", limit }: Props) {
  const [ads, setAds] = useState<LiveAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (state)  params.set("state",  state);
      if (city)   params.set("city",   city);
      const res = await fetch(`/api/ads/live${params.toString() ? `?${params}` : ""}`);
      const json = await res.json();
      if (json.success) setAds(json.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, state, city]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const displayed = limit ? ads.slice(0, limit) : ads;

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {[...Array(limit ?? 6)].map((_, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #D8E4EE", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Image area */}
            <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
            {/* Body */}
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div className="skeleton" style={{ height: 16, width: "70%" }} />
              <div className="skeleton" style={{ height: 12, width: "90%" }} />
              <div className="skeleton" style={{ height: 12, width: "60%" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div className="skeleton" style={{ width: 16, height: 16, borderRadius: "50%" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <div className="skeleton" style={{ height: 13, width: "55%" }} />
                  <div className="skeleton" style={{ height: 11, width: "35%" }} />
                </div>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid #EDF2F7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="skeleton" style={{ height: 12, width: "40%" }} />
              <div className="skeleton" style={{ height: 12, width: "12%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#6B8FA8" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#1A3A5C", marginBottom: 6 }}>
          {search || state || city ? "No ads match your filter" : "No live ads at the moment"}
        </div>
        <div style={{ fontSize: 13 }}>
          {search || state || city ? "Try adjusting your search or location" : "Check back soon — new ads go live daily"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
      {displayed.map((ad) => <AdCard key={ad.id} ad={ad} />)}
    </div>
  );
}
