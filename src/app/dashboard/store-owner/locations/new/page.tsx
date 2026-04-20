"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  storeName:    z.string().min(2,  "Store name must be at least 2 characters"),
  displayName:  z.string().optional(),
  addressLine1: z.string().min(5,  "Enter a full street address"),
  addressLine2: z.string().optional(),
  countryId:    z.string().min(1,  "Select a country"),
  stateId:      z.string().min(1,  "Select a state"),
  cityId:       z.string().min(1,  "Select a city"),
  postalCodeId: z.string().min(1,  "Select a postal code"),
  currency:     z.enum(["USD", "CAD", "GBP", "EUR"]),
});
type FormData = z.infer<typeof schema>;

const ACCENT = "#1A3A5C";
const inp: React.CSSProperties = {
  width: "100%", height: 40, borderRadius: 8, padding: "0 12px",
  border: "1px solid #D1DDE8", background: "#F7F9FC", color: ACCENT,
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
  color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em",
};

function inputStyle(err?: boolean): React.CSSProperties {
  return { ...inp, border: `1px solid ${err ? "#fca5a5" : "#D1DDE8"}`, background: err ? "#fff5f5" : "#F7F9FC" };
}
function selectStyle(err?: boolean): React.CSSProperties {
  return { ...inputStyle(err), cursor: "pointer" };
}
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ margin: "4px 0 0", fontSize: 12, color: "#b91c1c" }}>{msg}</p>;
}

type Option = { id: string; name: string };

export default function NewLocationPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD" },
  });

  const [submitError, setSubmitError] = useState("");
  const [countries, setCountries] = useState<(Option & { code: string })[]>([]);
  const [states,    setStates]    = useState<Option[]>([]);
  const [cities,    setCities]    = useState<Option[]>([]);
  const [postalCodes, setPostalCodes] = useState<(Option & { code: string })[]>([]);

  const watchedCountry = watch("countryId");
  const watchedState   = watch("stateId");
  const watchedCity    = watch("cityId");

  // Load countries once
  useEffect(() => {
    fetch("/api/geo/countries").then(r => r.json()).then(j => j.success && setCountries(j.data));
  }, []);

  // Reset downstream when country changes
  useEffect(() => {
    if (!watchedCountry) return;
    setStates([]); setCities([]); setPostalCodes([]);
    setValue("stateId", ""); setValue("cityId", ""); setValue("postalCodeId", "");
    fetch(`/api/geo/states?countryId=${watchedCountry}`).then(r => r.json()).then(j => j.success && setStates(j.data));
  }, [watchedCountry, setValue]);

  // Reset city + postal when state changes
  useEffect(() => {
    if (!watchedState) return;
    setCities([]); setPostalCodes([]);
    setValue("cityId", ""); setValue("postalCodeId", "");
    fetch(`/api/geo/cities?stateId=${watchedState}`).then(r => r.json()).then(j => j.success && setCities(j.data));
  }, [watchedState, setValue]);

  // Reset postal when city changes
  useEffect(() => {
    if (!watchedCity) return;
    setPostalCodes([]);
    setValue("postalCodeId", "");
    fetch(`/api/geo/postal-codes?cityId=${watchedCity}`).then(r => r.json()).then(j => j.success && setPostalCodes(j.data));
  }, [watchedCity, setValue]);

  async function onSubmit(data: FormData) {
    setSubmitError("");
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push("/dashboard/store-owner");
    } catch (e: any) {
      setSubmitError(e.message || "Failed to create location");
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <a href="/dashboard/store-owner" style={{ fontSize: 13, color: "#6B8FA8", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
        ← Back to locations
      </a>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>Add Location</h1>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>Register a store location where ads will be displayed on screen.</p>

      {submitError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>

        <div>
          <label style={lbl}>Store name *</label>
          <input {...register("storeName")} placeholder="e.g. Whole Foods Market" style={inputStyle(!!errors.storeName)} />
          <FieldError msg={errors.storeName?.message} />
        </div>

        <div>
          <label style={lbl}>Display name (shown on screen)</label>
          <input {...register("displayName")} placeholder="Optional — defaults to store name" style={inputStyle()} />
        </div>

        <div>
          <label style={lbl}>Address line 1 *</label>
          <input {...register("addressLine1")} placeholder="123 Main St" style={inputStyle(!!errors.addressLine1)} />
          <FieldError msg={errors.addressLine1?.message} />
        </div>

        <div>
          <label style={lbl}>Address line 2</label>
          <input {...register("addressLine2")} placeholder="Suite, floor, etc." style={inputStyle()} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Country *</label>
            <select {...register("countryId")} style={selectStyle(!!errors.countryId)}>
              <option value="">Select country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <FieldError msg={errors.countryId?.message} />
          </div>

          <div>
            <label style={lbl}>State *</label>
            <select {...register("stateId")} disabled={!states.length} style={selectStyle(!!errors.stateId)}>
              <option value="">Select state</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <FieldError msg={errors.stateId?.message} />
          </div>

          <div>
            <label style={lbl}>City *</label>
            <select {...register("cityId")} disabled={!cities.length} style={selectStyle(!!errors.cityId)}>
              <option value="">Select city</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <FieldError msg={errors.cityId?.message} />
          </div>

          <div>
            <label style={lbl}>Postal code *</label>
            <select {...register("postalCodeId")} disabled={!postalCodes.length} style={selectStyle(!!errors.postalCodeId)}>
              <option value="">Select postal code</option>
              {postalCodes.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
            <FieldError msg={errors.postalCodeId?.message} />
          </div>
        </div>

        <div>
          <label style={lbl}>Currency</label>
          <select {...register("currency")} style={{ ...selectStyle(), width: 120 }}>
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
          <button type="submit" disabled={isSubmitting} style={{ padding: "10px 24px", borderRadius: 8, background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 600, border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Creating…" : "Create Location"}
          </button>
        </div>
      </form>
    </div>
  );
}
