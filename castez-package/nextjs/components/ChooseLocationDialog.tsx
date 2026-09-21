"use client";

import { useEffect, useMemo, useState } from "react";

type LocationFilter = { country: string; state: string; city: string };

const LOCATIONS: Record<string, Record<string, string[]>> = {
  "United States": {
    California: ["Los Angeles", "San Diego", "San Francisco", "San Jose"],
    Illinois: ["Chicago", "Naperville", "Springfield"],
    "New York": ["Brooklyn", "Buffalo", "New York City", "Queens"],
    Texas: ["Austin", "Dallas", "Houston", "San Antonio"],
  },
  Canada: {
    "British Columbia": ["Surrey", "Vancouver", "Victoria"],
    Ontario: ["Mississauga", "Ottawa", "Toronto"],
  },
};

const ALL_STATES = "All states";
const ALL_CITIES = "All cities";

const fieldLabel =
  "mb-2 block font-mono text-[11px] tracking-[0.14em] text-zinc-400";
const fieldBase =
  "w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-[15px] text-zinc-100 outline-none transition focus:border-emerald-300 focus:ring-[3px] focus:ring-emerald-300/15 disabled:cursor-not-allowed disabled:text-zinc-600";

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export type ChooseLocationDialogProps = {
  open: boolean;
  onClose: () => void;
  onApply: (filter: LocationFilter) => void;
  initial?: Partial<LocationFilter>;
};

export default function ChooseLocationDialog({
  open,
  onClose,
  onApply,
  initial,
}: ChooseLocationDialogProps) {
  const [country, setCountry] = useState(initial?.country ?? "United States");
  const [state, setState] = useState(initial?.state ?? ALL_STATES);
  const [city, setCity] = useState(initial?.city ?? ALL_CITIES);

  const states = useMemo(() => Object.keys(LOCATIONS[country] ?? {}), [country]);
  const cities = useMemo(
    () => (state === ALL_STATES ? [] : LOCATIONS[country]?.[state] ?? []),
    [country, state]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const clear = () => {
    setCountry("United States");
    setState(ALL_STATES);
    setCity(ALL_CITIES);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="choose-location-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/85 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-white/[0.02] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 text-emerald-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <h2
              id="choose-location-title"
              className="font-[var(--font-display,'Space_Grotesk')] text-lg font-bold tracking-tight text-zinc-50"
            >
              Choose Location
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="px-6 py-6">
          <label htmlFor="cl-country" className={fieldLabel}>
            COUNTRY
          </label>
          <div className="relative mb-5">
            <select
              id="cl-country"
              className={fieldBase}
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setState(ALL_STATES);
                setCity(ALL_CITIES);
              }}
            >
              {Object.keys(LOCATIONS).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <Chevron />
          </div>

          <label htmlFor="cl-state" className={fieldLabel}>
            STATE
          </label>
          <div className="relative mb-5">
            <select
              id="cl-state"
              className={fieldBase}
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setCity(ALL_CITIES);
              }}
            >
              <option>{ALL_STATES}</option>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Chevron />
          </div>

          <label htmlFor="cl-city" className={fieldLabel}>
            CITY
          </label>
          <div className="relative mb-7">
            <select
              id="cl-city"
              className={fieldBase}
              value={city}
              disabled={state === ALL_STATES}
              onChange={(e) => setCity(e.target.value)}
            >
              <option>{ALL_CITIES}</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <Chevron />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={clear}
              className="flex-1 rounded-xl border border-zinc-800 bg-white/[0.02] px-4 py-3.5 text-[15px] font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-white/5"
            >
              Clear filter
            </button>
            <button
              type="button"
              onClick={() => onApply({ country, state, city })}
              className="flex-[1.6] rounded-xl bg-gradient-to-b from-emerald-300 to-teal-400 px-4 py-3.5 text-[15px] font-bold text-emerald-950 shadow-[0_14px_40px_-12px_rgba(62,230,209,0.55)] transition hover:brightness-110"
            >
              Show ads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
