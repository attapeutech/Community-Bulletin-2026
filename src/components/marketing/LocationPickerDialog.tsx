"use client";

import { MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Country = { id: string; name: string; code: string };
type StateRow = { id: string; name: string; code: string };
type CityRow = { id: string; name: string };

type SelectedLocation = { stateCode: string; stateName: string; cityName: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (loc: SelectedLocation | null) => void;
  initial?: SelectedLocation | null;
};

// Styling from castez-package/nextjs/components/ChooseLocationDialog.tsx,
// translated onto the ce-* tokens so it follows the theme. Native <option>
// popups follow it too via the color-scheme rule in globals.css.
const LABEL = "mb-2 block font-ce-mono text-[11px] tracking-[0.14em] text-ce-muted";

const FIELD =
  "w-full appearance-none rounded-xl border border-ce-line4 bg-ce-card px-4 py-3 text-[15px] text-ce-text outline-none transition focus:border-ce-accent focus:ring-[3px] focus:ring-ce-accent/15 disabled:cursor-not-allowed disabled:text-ce-muted4";

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ce-muted3"
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

export default function LocationPickerDialog({ open, onClose, onSave, initial }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState("");
  const [stateList, setStateList] = useState<StateRow[]>([]);
  const [stateId, setStateId] = useState("");
  const [stateCode, setStateCode] = useState(initial?.stateCode ?? "");
  const [stateName, setStateName] = useState(initial?.stateName ?? "");
  const [cityList, setCityList] = useState<CityRow[]>([]);
  const [cityName, setCityName] = useState(initial?.cityName ?? "");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    fetch("/api/geo/countries")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setCountries(j.data);
          const usa = j.data.find((c: Country) => c.code === "US");
          if (usa) setCountryId(usa.id);
        }
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!countryId) return;
    setLoadingStates(true);
    setStateList([]);
    setStateId("");
    setStateCode("");
    setStateName("");
    setCityList([]);
    setCityName("");
    fetch("/api/geo/states?countryId=" + countryId)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setStateList(j.data);
      })
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, [countryId]);

  useEffect(() => {
    if (!stateId) return;
    setLoadingCities(true);
    setCityList([]);
    setCityName("");
    fetch("/api/geo/cities?stateId=" + stateId)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCityList(j.data);
      })
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  }, [stateId]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  // Escape to dismiss, and hold the page still while the dialog is up.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleClose]);

  // Portalled to document.body: this renders inside the nav, whose
  // backdrop-filter makes the header a containing block for fixed-position
  // descendants, so the overlay would otherwise be trapped under the nav.
  if (!open || !mounted) return null;

  const handleStateChange = (id: string) => {
    setStateId(id);
    const s = stateList.find((row) => row.id === id);
    setStateCode(s?.code ?? "");
    setStateName(s?.name ?? "");
  };

  const handleSave = () => {
    if (!stateCode) {
      onSave(null);
      onClose();
      return;
    }
    onSave({ stateCode, stateName, cityName });
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  return createPortal(
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="choose-location-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(90vh,640px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-ce-line4 bg-ce-surface/95 outline-none backdrop-blur-xl"
        style={{ boxShadow: "0 40px 80px -40px rgba(0,0,0,0.9)" }}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ce-line3 bg-ce-text/[0.02] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <MapPin size={20} strokeWidth={1.8} className="text-ce-accent" />
            <h2
              id="choose-location-title"
              className="font-ce-display text-lg font-bold tracking-tight text-ce-text"
            >
              Choose Location
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ce-muted3 transition hover:bg-ce-text/5 hover:text-ce-text"
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </header>

        {/* Scrolls when the viewport is too short for the whole form */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <label htmlFor="cl-country" className={LABEL}>
            COUNTRY
          </label>
          <div className="relative mb-5">
            <select
              id="cl-country"
              className={FIELD}
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
            >
              <option value="">Select country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Chevron />
          </div>

          <label htmlFor="cl-state" className={LABEL}>
            STATE
          </label>
          <div className="relative mb-5">
            <select
              id="cl-state"
              className={FIELD}
              value={stateId}
              disabled={!countryId || loadingStates}
              onChange={(e) => handleStateChange(e.target.value)}
            >
              <option value="">{loadingStates ? "Loading…" : "All states"}</option>
              {stateList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Chevron />
          </div>

          <label htmlFor="cl-city" className={LABEL}>
            CITY
          </label>
          <div className="relative mb-7">
            <select
              id="cl-city"
              className={FIELD}
              value={cityName}
              disabled={!stateId || loadingCities}
              onChange={(e) => setCityName(e.target.value)}
            >
              <option value="">{loadingCities ? "Loading…" : "All cities"}</option>
              {cityList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <Chevron />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-xl border border-ce-line4 bg-ce-text/[0.02] px-4 py-3.5 text-[15px] font-semibold text-ce-text2 transition hover:border-ce-line5 hover:bg-ce-text/5"
            >
              Clear filter
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-[1.6] rounded-xl bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-4 py-3.5 text-[15px] font-bold text-ce-onAccent transition hover:brightness-110"
              style={{ boxShadow: "0 14px 40px -12px rgba(62,230,209,0.55)" }}
            >
              Show ads
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
