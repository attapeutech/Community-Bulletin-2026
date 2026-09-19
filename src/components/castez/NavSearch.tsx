"use client";

import { ChevronDown, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LocationPickerDialog from "@/components/marketing/LocationPickerDialog";
import {
  readSavedLocation,
  writeSavedLocation,
  type SavedLocation,
} from "@/lib/location-preference";

const DEBOUNCE_MS = 400;

/**
 * Location filter + live-ads search as one segmented control, per
 * castez-package/nextjs/components/Navbar.tsx.
 *
 * Behaviour is the old PublicLayout navbar's: the location persists to
 * localStorage and both controls push to /live-ads with query params.
 */
export function NavSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocation(readSavedLocation());
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const pushLiveAds = useCallback(
    (loc: SavedLocation | null, q: string) => {
      const params = new URLSearchParams();
      if (loc?.stateCode) params.set("state", loc.stateCode);
      if (loc?.cityName) params.set("city", loc.cityName);
      if (q.trim()) params.set("search", q.trim());
      router.push(`/live-ads${params.toString() ? `?${params}` : ""}`);
    },
    [router]
  );

  function handleLocationSave(loc: SavedLocation | null) {
    setLocation(loc);
    writeSavedLocation(loc);
    setPickerOpen(false);
    pushLiveAds(loc, search);
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushLiveAds(location, value), DEBOUNCE_MS);
  }

  const label = location
    ? location.cityName
      ? `${location.cityName}, ${location.stateCode}`
      : location.stateName || location.stateCode
    : "All locations";

  return (
    <>
      <div
        className={`flex min-w-0 items-stretch overflow-hidden rounded-full border border-ce-line3 bg-ce-panel transition focus-within:border-ce-accent focus-within:ring-[3px] focus-within:ring-ce-accent/15 ${
          compact
            ? "w-full"
            : "max-w-[430px] flex-1 max-[1000px]:max-w-[300px] max-[860px]:max-w-none max-[860px]:flex-none"
        }`}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label={`Location: ${label}. Change location`}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-ce-line3 px-3.5 text-[13px] font-semibold text-ce-muted transition hover:bg-ce-text/[0.04] hover:text-ce-text max-[860px]:px-2.5"
        >
          <MapPin size={15} className="text-ce-accent" />
          <span className={compact ? "inline" : "max-[860px]:hidden"}>{label}</span>
          <ChevronDown size={13} className="text-ce-muted3" />
        </button>

        <div className={`relative min-w-0 flex-1 ${compact ? "" : "max-[860px]:hidden"}`}>
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ce-muted3"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search screens in this location"
            placeholder="Search screens in this location"
            className="h-full w-full bg-transparent py-2.5 pl-[34px] pr-3.5 text-[13px] text-ce-text outline-none placeholder:text-ce-muted4"
          />
        </div>
      </div>

      <LocationPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSave={handleLocationSave}
        initial={location}
      />
    </>
  );
}
