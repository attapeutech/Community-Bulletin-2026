"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#1A3A5C";

const inp: React.CSSProperties = {
  width: "100%", height: 40, borderRadius: 8, padding: "0 12px",
  border: "1px solid #D1DDE8", background: "#F7F9FC", color: "#1A3A5C",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const sel: React.CSSProperties = { ...inp, height: 40, cursor: "pointer" };
const lbl: React.CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
  color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em",
};

type Option = { id: string; name: string };

export default function NewLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    storeName: "", addressLine1: "", addressLine2: "", displayName: "",
    currency: "USD", countryId: "", stateId: "", cityId: "", postalCodeId: "",
  });
  const [countries, setCountries] = useState<(Option & { code: string })[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [postalCodes, setPostalCodes] = useState<(Option & { code: string })[]>([]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Load countries
  useEffect(() => {
    fetch("/api/geo/countries").then(r => r.json()).then(j => j.success && setCountries(j.data));
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!form.countryId) return;
    setStates([]); setCities([]); setPostalCodes([]);
    set("stateId", ""); set("cityId", ""); set("postalCodeId", "");
    fetch(`/api/geo/states?countryId=${form.countryId}`).then(r => r.json()).then(j => j.success && setStates(j.data));
  }, [form.countryId]);

  // Load cities when state changes
  useEffect(() => {
    if (!form.stateId) return;
    setCities([]); setPostalCodes([]);
    set("cityId", ""); set("postalCodeId", "");
    fetch(`/api/geo/cities?stateId=${form.stateId}`).then(r => r.json()).then(j => j.success && setCities(j.data));
  }, [form.stateId]);

  // Load postal codes when city changes
  useEffect(() => {
    if (!form.cityId) return;
    setPostalCodes([]);
    set("postalCodeId", "");
    fetch(`/api/geo/postal-codes?cityId=${form.cityId}`).then(r => r.json()).then(j => j.success && setPostalCodes(j.data));
  }, [form.cityId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.countryId || !form.stateId || !form.cityId || !form.postalCodeId) {
      setError("Please complete all address fields."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push("/dashboard/store-owner");
    } catch (e: any) {
      setError(e.message || "Failed to create location");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <a href="/dashboard/store-owner" style={{ fontSize: 13, color: "#6B8FA8", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
        ← Back to locations
      </a>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>Add Location</h1>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>Register a store location where ads will be displayed on screen.</p>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={lbl}>Store name *</label>
          <input style={inp} required placeholder="e.g. Whole Foods Market" value={form.storeName} onChange={e => set("storeName", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Display name (shown on screen)</label>
          <input style={inp} placeholder="Optional — defaults to store name" value={form.displayName} onChange={e => set("displayName", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Address line 1 *</label>
          <input style={inp} required placeholder="123 Main St" value={form.addressLine1} onChange={e => set("addressLine1", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Address line 2</label>
          <input style={inp} placeholder="Suite, floor, etc." value={form.addressLine2} onChange={e => set("addressLine2", e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Country *</label>
            <select style={sel} value={form.countryId} onChange={e => set("countryId", e.target.value)} required>
              <option value="">Select country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>State *</label>
            <select style={sel} value={form.stateId} onChange={e => set("stateId", e.target.value)} required disabled={!states.length}>
              <option value="">Select state</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>City *</label>
            <select style={sel} value={form.cityId} onChange={e => set("cityId", e.target.value)} required disabled={!cities.length}>
              <option value="">Select city</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Postal code *</label>
            <select style={sel} value={form.postalCodeId} onChange={e => set("postalCodeId", e.target.value)} required disabled={!postalCodes.length}>
              <option value="">Select postal code</option>
              {postalCodes.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>Currency</label>
          <select style={{ ...sel, width: 120 }} value={form.currency} onChange={e => set("currency", e.target.value)}>
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <a href="/dashboard/store-owner" style={{ padding: "10px 20px", borderRadius: 8, background: "#E8EFF6", color: ACCENT, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Cancel
          </a>
          <button type="submit" disabled={loading} style={{ padding: "10px 24px", borderRadius: 8, background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating…" : "Create Location"}
          </button>
        </div>
      </form>
    </div>
  );
}
