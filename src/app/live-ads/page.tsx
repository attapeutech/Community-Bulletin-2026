"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { useSession } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LiveAdsGrid from "@/components/marketing/LiveAdsGrid";
import LocationPickerDialog from "@/components/marketing/LocationPickerDialog";
import { readSavedLocation, writeSavedLocation } from "@/lib/location-preference";

type SelectedLocation = { stateCode: string; stateName: string; cityName: string };

function LiveAdsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const stateParam  = searchParams.get("state")  ?? "";
  const cityParam   = searchParams.get("city")   ?? "";
  const searchParam = searchParams.get("search") ?? "";

  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  // Priority: URL params → localStorage → null
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(() => {
    if (stateParam) return { stateCode: stateParam, stateName: stateParam, cityName: cityParam };
    return readSavedLocation();
  });
  const [searchInput, setSearchInput] = useState(searchParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When URL location params change, sync state and persist
  useEffect(() => {
    if (stateParam) {
      const loc = { stateCode: stateParam, stateName: stateParam, cityName: cityParam };
      setSelectedLocation(loc);
      writeSavedLocation(loc);
    }
  }, [stateParam, cityParam]);

  const pushParams = useCallback((loc: SelectedLocation | null, q: string) => {
    const params = new URLSearchParams();
    if (loc?.stateCode) params.set("state", loc.stateCode);
    if (loc?.cityName)  params.set("city",  loc.cityName);
    if (q.trim())       params.set("search", q.trim());
    router.push(`/live-ads${params.toString() ? `?${params}` : ""}`);
  }, [router]);

  const handleLocationSave = (loc: SelectedLocation | null) => {
    setSelectedLocation(loc);
    writeSavedLocation(loc);
    pushParams(loc, searchInput);
  };

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams(selectedLocation, val), 400);
  };

  const locationLabel = selectedLocation
    ? selectedLocation.cityName
      ? `${selectedLocation.cityName}, ${selectedLocation.stateCode}`
      : selectedLocation.stateName || selectedLocation.stateCode
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB" }}>

      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #D8E4EE", height: 64, display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ background: "#E8EFF6", borderRadius: 10, padding: 6, display: "flex" }}>
            <Icon size={28} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 13, color: "#1A3A5C" }}>Community</div>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 13 }}>
              <span style={{ color: "#E8563A" }}>Bulletin</span>
              <span style={{ color: "#4A90C4", fontSize: 10, fontWeight: 400 }}>.com</span>
            </div>
          </div>
        </Link>

        <button
          onClick={() => setLocationPickerOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 8,
            border: `1px solid ${locationLabel ? "#4A90C4" : "#D8E4EE"}`,
            background: locationLabel ? "#EDF5FF" : "#fff",
            color: locationLabel ? "#1A3A5C" : "#6B8FA8",
            fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          <span>📍</span>
          {locationLabel ?? "All locations"}
          {locationLabel && (
            <span
              onClick={(e) => { e.stopPropagation(); handleLocationSave(null); }}
              style={{ marginLeft: 2, color: "#6B8FA8", fontWeight: 400, fontSize: 14 }}
            >×</span>
          )}
        </button>

        <div style={{ flex: 1, position: "relative", maxWidth: 440 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9DB8CC", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by location, title, store #, or ad ID…"
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 32px 9px 34px", border: "1px solid #D8E4EE", borderRadius: 8, fontSize: 13, color: "#1A3A5C", background: "#FAFCFF", outline: "none", boxSizing: "border-box" }}
          />
          {searchInput && (
            <button onClick={() => handleSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9DB8CC", fontSize: 16 }}>×</button>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {session ? (
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#fff", background: "#1A3A5C", padding: "6px 14px 6px 8px", borderRadius: 30, flexShrink: 0 }}>
            <Avatar style={{ width: 26, height: 26 }}>
              <AvatarImage src={session.user.image ?? ""} />
              <AvatarFallback style={{ background: "#4A90C4", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                {(session.user.name ?? "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            Dashboard
          </Link>
        ) : (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Link href="/login" style={{ textDecoration: "none", fontSize: 13, fontWeight: 600, color: "#1A3A5C", padding: "7px 14px", borderRadius: 8, border: "1px solid #D8E4EE" }}>Sign in</Link>
            <Link href="/register" style={{ textDecoration: "none", fontSize: 13, fontWeight: 600, color: "#fff", padding: "7px 14px", borderRadius: 8, background: "#1A3A5C" }}>Get started</Link>
          </div>
        )}
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E8563A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Live right now</div>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, color: "#1A3A5C", margin: 0 }}>
              {locationLabel ? `Live Ads — ${locationLabel}` : "All Live Ads"}
            </h1>
          </div>
          <Link href="/" style={{ textDecoration: "none", fontSize: 13, color: "#6B8FA8", display: "inline-flex", alignItems: "center", gap: 4 }}>
            ← Back to home
          </Link>
        </div>

        <LiveAdsGrid
          state={selectedLocation?.stateCode ?? ""}
          city={selectedLocation?.cityName ?? ""}
          search={searchInput}
        />
      </main>

      <LocationPickerDialog
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSave={handleLocationSave}
        initial={selectedLocation}
      />
    </div>
  );
}

export default function LiveAdsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B8FA8", fontSize: 14 }}>
        Loading…
      </div>
    }>
      <LiveAdsContent />
    </Suspense>
  );
}
