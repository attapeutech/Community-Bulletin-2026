"use client";

import { MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-ce-muted3";

// colorScheme tells the browser to paint the native <option> popup dark;
// without it the dropdown list renders light against a dark control.
const SELECT =
  "w-full appearance-none rounded-lg border border-ce-line4 bg-ce-surface px-3.5 py-2.5 text-sm text-ce-text outline-none transition-colors focus:border-ce-accent/60 disabled:opacity-50 bg-[length:12px] bg-[right_12px_center] bg-no-repeat";

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239aa3b2' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")";

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

  // Fetch countries on open
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

  // Fetch states when country is selected
  useEffect(() => {
    if (!countryId) return;
    setLoadingStates(true);
    setStateList([]);
    setStateId("");
    setStateCode("");
    setStateName("");
    setCityList([]);
    setCityName("");
    fetch(`/api/geo/states?countryId=${countryId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setStateList(j.data);
      })
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, [countryId]);

  // Fetch cities when state is selected
  useEffect(() => {
    if (!stateId) return;
    setLoadingCities(true);
    setCityList([]);
    setCityName("");
    fetch(`/api/geo/cities?stateId=${stateId}`)
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

  if (!open) return null;

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

  const selectStyle = { backgroundImage: CHEVRON, colorScheme: "dark" as const };

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-[3px]"
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-picker-title"
        tabIndex={-1}
        className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(90vh,640px)] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-ce-line4 bg-ce-ground outline-none"
        style={{ boxShadow: "0 40px 80px -30px rgba(0,0,0,.9)" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ce-line3 bg-ce-panel px-6 py-4">
          <div className="flex items-center gap-2.5">
            <MapPin size={17} className="text-ce-accent" />
            <span
              id="location-picker-title"
              className="font-ce-display text-[17px] font-bold tracking-[-0.02em] text-ce-text"
            >
              Choose Location
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-1 text-ce-muted3 transition-colors hover:text-ce-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrolls when the viewport is too short for the whole form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className={LABEL} htmlFor="lp-country">
              Country
            </label>
            <select
              id="lp-country"
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className={SELECT}
              style={selectStyle}
            >
              <option value="">Select country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className={LABEL} htmlFor="lp-state">
              State
            </label>
            <select
              id="lp-state"
              value={stateId}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={!countryId || loadingStates}
              className={SELECT}
              style={selectStyle}
            >
              <option value="">{loadingStates ? "Loading…" : "All states"}</option>
              {stateList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className={LABEL} htmlFor="lp-city">
              City
            </label>
            <select
              id="lp-city"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              disabled={!stateId || loadingCities}
              className={SELECT}
              style={selectStyle}
            >
              <option value="">{loadingCities ? "Loading…" : "All cities"}</option>
              {cityList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-lg border border-ce-line4 bg-ce-raised px-4 py-2.5 text-[13px] font-semibold text-ce-muted transition-colors hover:text-ce-text"
            >
              Clear filter
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-[2] rounded-lg bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-4 py-2.5 text-sm font-bold text-ce-onAccent"
              style={{ boxShadow: "0 8px 24px -8px rgba(62,230,209,.5)" }}
            >
              Show ads{stateCode ? ` in ${cityName || stateName}` : ""}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
