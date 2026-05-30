"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Globe, MapPin, Building2, Hash } from "lucide-react";

type Country = { id: string; name: string; code: string };
type State   = { id: string; name: string; code: string };
type City    = { id: string; name: string };
type Postal  = { id: string; code: string };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">
      {children}
    </p>
  );
}

function EntryList({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  if (!items.length) return (
    <p className="text-sm text-muted-foreground italic">No {label} added yet.</p>
  );
  return (
    <ul className="divide-y divide-[#E8EFF6] text-sm">
      {items.map(i => (
        <li key={i.id} className="py-1.5 text-[#1A3A5C]">{i.label}</li>
      ))}
    </ul>
  );
}

// ─── Countries tab ───────────────────────────────────────────────────────────
function CountriesTab({ countries, onAdded }: { countries: Country[]; onAdded: (c: Country) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim() || !code.trim()) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/geo/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, phoneCode, currencyCode, currencySymbol }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.name} added`);
      onAdded(json.data);
      setName(""); setCode(""); setPhoneCode(""); setCurrencyCode(""); setCurrencySymbol("");
    } catch { toast.error("Failed to add country"); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add Country</h3>
          <div>
            <SectionLabel>Country name *</SectionLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. United States" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionLabel>ISO code * (2 chars)</SectionLabel>
              <Input value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0,2))} placeholder="US" maxLength={2} className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
            <div>
              <SectionLabel>Phone code</SectionLabel>
              <Input value={phoneCode} onChange={e => setPhoneCode(e.target.value)} placeholder="+1" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionLabel>Currency code</SectionLabel>
              <Input value={currencyCode} onChange={e => setCurrencyCode(e.target.value.toUpperCase().slice(0,3))} placeholder="USD" maxLength={3} className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
            <div>
              <SectionLabel>Currency symbol</SectionLabel>
              <Input value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} placeholder="$" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />
            {saving ? "Adding…" : "Add Country"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">Countries ({countries.length})</h3>
          <EntryList items={countries.map(c => ({ id: c.id, label: `${c.name} (${c.code})` }))} label="countries" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── States tab ──────────────────────────────────────────────────────────────
function StatesTab({ countries }: { countries: Country[] }) {
  const [countryId, setCountryId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    if (!countryId) { setStates([]); return; }
    setLoadingStates(true);
    fetch(`/api/geo/states?countryId=${countryId}`)
      .then(r => r.json())
      .then(j => j.success && setStates(j.data))
      .finally(() => setLoadingStates(false));
  }, [countryId]);

  async function handleAdd() {
    if (!countryId) { toast.error("Select a country"); return; }
    if (!name.trim() || !code.trim()) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/geo/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryId, name, code }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.name} added`);
      setStates(prev => [...prev, json.data].sort((a,b) => a.name.localeCompare(b.name)));
      setName(""); setCode("");
    } catch { toast.error("Failed to add state"); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add State / Province</h3>
          <div>
            <SectionLabel>Country *</SectionLabel>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel>State / Province name *</SectionLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Washington" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <div>
            <SectionLabel>State code *</SectionLabel>
            <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. WA" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />
            {saving ? "Adding…" : "Add State"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">
            States {countryId ? `(${states.length})` : "— select a country"}
          </h3>
          {loadingStates
            ? <p className="text-sm text-muted-foreground">Loading…</p>
            : <EntryList items={states.map(s => ({ id: s.id, label: `${s.name} (${s.code})` }))} label="states" />
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Cities tab ───────────────────────────────────────────────────────────────
function CitiesTab({ countries }: { countries: Country[] }) {
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId]   = useState("");
  const [name, setName]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [states, setStates]     = useState<State[]>([]);
  const [cities, setCities]     = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (!countryId) { setStates([]); setStateId(""); setCities([]); return; }
    setLoadingStates(true);
    fetch(`/api/geo/states?countryId=${countryId}`)
      .then(r => r.json())
      .then(j => j.success && setStates(j.data))
      .finally(() => setLoadingStates(false));
    setStateId(""); setCities([]);
  }, [countryId]);

  useEffect(() => {
    if (!stateId) { setCities([]); return; }
    setLoadingCities(true);
    fetch(`/api/geo/cities?stateId=${stateId}`)
      .then(r => r.json())
      .then(j => j.success && setCities(j.data))
      .finally(() => setLoadingCities(false));
  }, [stateId]);

  async function handleAdd() {
    if (!stateId) { toast.error("Select a state"); return; }
    if (!name.trim()) { toast.error("City name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/geo/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateId, name }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.name} added`);
      setCities(prev => [...prev, json.data].sort((a,b) => a.name.localeCompare(b.name)));
      setName("");
    } catch { toast.error("Failed to add city"); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add City</h3>
          <div>
            <SectionLabel>Country *</SectionLabel>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel>State / Province *</SectionLabel>
            <Select value={stateId} onValueChange={setStateId} disabled={!states.length}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]">
                <SelectValue placeholder={loadingStates ? "Loading…" : "Select state"} />
              </SelectTrigger>
              <SelectContent>
                {states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel>City name *</SectionLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Seattle" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />
            {saving ? "Adding…" : "Add City"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">
            Cities {stateId ? `(${cities.length})` : "— select a state"}
          </h3>
          {loadingCities
            ? <p className="text-sm text-muted-foreground">Loading…</p>
            : <EntryList items={cities.map(c => ({ id: c.id, label: c.name }))} label="cities" />
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Postal Codes tab ─────────────────────────────────────────────────────────
function PostalCodesTab({ countries }: { countries: Country[] }) {
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId]     = useState("");
  const [cityId, setCityId]       = useState("");
  const [code, setCode]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [states, setStates]       = useState<State[]>([]);
  const [cities, setCities]       = useState<City[]>([]);
  const [postals, setPostals]     = useState<Postal[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPostals, setLoadingPostals] = useState(false);

  useEffect(() => {
    if (!countryId) { setStates([]); setStateId(""); setCities([]); setCityId(""); setPostals([]); return; }
    setLoadingStates(true);
    fetch(`/api/geo/states?countryId=${countryId}`)
      .then(r => r.json()).then(j => j.success && setStates(j.data))
      .finally(() => setLoadingStates(false));
    setStateId(""); setCities([]); setCityId(""); setPostals([]);
  }, [countryId]);

  useEffect(() => {
    if (!stateId) { setCities([]); setCityId(""); setPostals([]); return; }
    setLoadingCities(true);
    fetch(`/api/geo/cities?stateId=${stateId}`)
      .then(r => r.json()).then(j => j.success && setCities(j.data))
      .finally(() => setLoadingCities(false));
    setCityId(""); setPostals([]);
  }, [stateId]);

  useEffect(() => {
    if (!cityId) { setPostals([]); return; }
    setLoadingPostals(true);
    fetch(`/api/geo/postal-codes?cityId=${cityId}`)
      .then(r => r.json()).then(j => j.success && setPostals(j.data.map((p: any) => ({ id: p.id, code: p.code }))))
      .finally(() => setLoadingPostals(false));
  }, [cityId]);

  async function handleAdd() {
    if (!cityId) { toast.error("Select a city"); return; }
    if (!code.trim()) { toast.error("Postal code is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/geo/postal-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateId, cityId, code }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.code} added`);
      setPostals(prev => [...prev, { id: json.data.id, code: json.data.code }].sort((a,b) => a.code.localeCompare(b.code)));
      setCode("");
    } catch { toast.error("Failed to add postal code"); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add Postal Code</h3>
          <div>
            <SectionLabel>Country *</SectionLabel>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel>State / Province *</SectionLabel>
            <Select value={stateId} onValueChange={setStateId} disabled={!states.length}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]">
                <SelectValue placeholder={loadingStates ? "Loading…" : "Select state"} />
              </SelectTrigger>
              <SelectContent>
                {states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel>City *</SectionLabel>
            <Select value={cityId} onValueChange={setCityId} disabled={!cities.length}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]">
                <SelectValue placeholder={loadingCities ? "Loading…" : "Select city"} />
              </SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel>Postal code *</SectionLabel>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. 98101" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />
            {saving ? "Adding…" : "Add Postal Code"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">
            Postal Codes {cityId ? `(${postals.length})` : "— select a city"}
          </h3>
          {loadingPostals
            ? <p className="text-sm text-muted-foreground">Loading…</p>
            : <EntryList items={postals.map(p => ({ id: p.id, label: p.code }))} label="postal codes" />
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GeoManagerClient() {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    fetch("/api/geo/countries").then(r => r.json()).then(j => j.success && setCountries(j.data));
  }, []);

  return (
    <div className="max-w-[900px] w-full">
      <a href="/dashboard/admin" className="inline-block mb-6 text-[13px] text-[#6B8FA8] no-underline hover:underline">
        ← Back to Admin Panel
      </a>
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1">Geography Manager</h1>
      <p className="text-[#6B8FA8] text-sm mb-8">
        Add countries, states, cities, and postal codes used in location registration.
      </p>

      <Tabs defaultValue="countries">
        <TabsList className="mb-6 bg-[#E8EFF6]">
          <TabsTrigger value="countries" className="gap-1.5"><Globe size={13} /> Countries</TabsTrigger>
          <TabsTrigger value="states"    className="gap-1.5"><MapPin size={13} /> States</TabsTrigger>
          <TabsTrigger value="cities"    className="gap-1.5"><Building2 size={13} /> Cities</TabsTrigger>
          <TabsTrigger value="postal"    className="gap-1.5"><Hash size={13} /> Postal Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="countries">
          <CountriesTab
            countries={countries}
            onAdded={c => setCountries(prev => [...prev, c].sort((a,b) => a.name.localeCompare(b.name)))}
          />
        </TabsContent>
        <TabsContent value="states">
          <StatesTab countries={countries} />
        </TabsContent>
        <TabsContent value="cities">
          <CitiesTab countries={countries} />
        </TabsContent>
        <TabsContent value="postal">
          <PostalCodesTab countries={countries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
