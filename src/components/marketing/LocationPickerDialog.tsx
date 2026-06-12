"use client";

import { useState, useEffect, useCallback } from "react";

type Country = { id: string; name: string; code: string };
type StateRow = { id: string; name: string; code: string };
type CityRow  = { id: string; name: string };

type SelectedLocation = { stateCode: string; stateName: string; cityName: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (loc: SelectedLocation | null) => void;
  initial?: SelectedLocation | null;
};

const ACCENT = "#1A3A5C";
const RED    = "#E8563A";

export default function LocationPickerDialog({ open, onClose, onSave, initial }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState("");
  const [stateList, setStateList] = useState<StateRow[]>([]);
  const [stateId,   setStateId]   = useState("");
  const [stateCode, setStateCode] = useState(initial?.stateCode ?? "");
  const [stateName, setStateName] = useState(initial?.stateName ?? "");
  const [cityList,  setCityList]  = useState<CityRow[]>([]);
  const [cityName,  setCityName]  = useState(initial?.cityName ?? "");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch countries on open
  useEffect(() => {
    if (!open) return;
    fetch("/api/geo/countries")
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setCountries(j.data);
          // Default to United States
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
    setStateId(""); setStateCode(""); setStateName("");
    setCityList([]); setCityName("");
    fetch(`/api/geo/states?countryId=${countryId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setStateList(j.data); })
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, [countryId]);

  // Fetch cities when state is selected
  useEffect(() => {
    if (!stateId) return;
    setLoadingCities(true);
    setCityList([]); setCityName("");
    fetch(`/api/geo/cities?stateId=${stateId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setCityList(j.data); })
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  }, [stateId]);

  if (!open) return null;

  const handleStateChange = (id: string) => {
    setStateId(id);
    const s = stateList.find(s => s.id === id);
    setStateCode(s?.code ?? "");
    setStateName(s?.name ?? "");
  };

  const handleSave = () => {
    if (!stateCode) { onSave(null); onClose(); return; }
    onSave({ stateCode, stateName, cityName });
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "1px solid #D8E4EE", borderRadius: 8,
    fontSize: 14, color: ACCENT, background: "#fff", outline: "none", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B8FA8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
    cursor: "pointer",
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,26,46,0.55)", backdropFilter: "blur(3px)" }} />

      {/* Dialog */}
      <div style={{ position: "fixed", zIndex: 201, top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(92vw, 420px)", background: "#fff", borderRadius: 16, boxShadow: "0 24px 56px rgba(10,26,46,0.22)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: ACCENT, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📍</span>
            <span style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>Choose Location</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {/* Country */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B8FA8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Country</label>
            <select
              value={countryId}
              onChange={e => setCountryId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select country…</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* State */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B8FA8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>State</label>
            <select
              value={stateId}
              onChange={e => handleStateChange(e.target.value)}
              disabled={!countryId || loadingStates}
              style={{ ...selectStyle, opacity: (!countryId || loadingStates) ? 0.5 : 1 }}
            >
              <option value="">{loadingStates ? "Loading…" : "All states"}</option>
              {stateList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* City */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B8FA8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>City</label>
            <select
              value={cityName}
              onChange={e => setCityName(e.target.value)}
              disabled={!stateId || loadingCities}
              style={{ ...selectStyle, opacity: (!stateId || loadingCities) ? 0.5 : 1 }}
            >
              <option value="">{loadingCities ? "Loading…" : "All cities"}</option>
              {cityList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleClear}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #D8E4EE", background: "#fff", color: "#6B8FA8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Clear filter
            </button>
            <button
              onClick={handleSave}
              style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Show ads{stateCode ? ` in ${cityName || stateName}` : ""}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
