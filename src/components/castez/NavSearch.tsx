"use client";

import { MapPin, Search } from "lucide-react";
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
 * Location filter + live-ads search, ported from PublicLayout's navbar.
 * Behaviour is unchanged: the location persists to localStorage and both
 * controls push to /live-ads with query params.
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
    : null;

  return (
    <>
      <div className={`flex items-center gap-1.5 ${compact ? "w-full" : "mx-2 max-w-[160px] flex-1 lg:mx-4 lg:max-w-sm"}`}>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label={label ? `Location: ${label}. Change location` : "Choose a location"}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
            label
              ? "border border-ce-accent/40 bg-ce-accent/10 text-ce-accentLight"
              : "border border-ce-line4 bg-ce-panel text-ce-muted hover:text-ce-text4"
          }`}
        >
          <MapPin size={12} />
          <span className={compact ? "inline" : "hidden lg:inline"}>{label ?? "All locations"}</span>
          {label && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear location"
              onClick={(e) => {
                e.stopPropagation();
                handleLocationSave(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLocationSave(null);
                }
              }}
              className="ml-0.5 text-sm font-normal leading-none text-ce-muted3 hover:text-ce-text"
            >
              ×
            </span>
          )}
        </button>

        <div className="relative flex-1">
          <Search
            size={13}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ce-muted4"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={compact ? "Search live ads…" : "Search…"}
            aria-label="Search live ads"
            className="w-full rounded-lg border border-ce-line4 bg-ce-surface py-1.5 pl-7 pr-6 text-sm text-ce-text outline-none transition-colors placeholder:text-ce-muted4 focus:border-ce-accent/60"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-base leading-none text-ce-muted4 hover:text-ce-text"
            >
              ×
            </button>
          )}
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
