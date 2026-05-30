"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Globe, MapPin, Building2, Hash, Pencil, Trash2, Check, X } from "lucide-react";

type Country = { id: string; name: string; code: string; phoneCode?: string | null; currencyCode?: string | null; currencySymbol?: string | null };
type State   = { id: string; name: string; code: string };
type City    = { id: string; name: string };
type Postal  = { id: string; code: string };

function FL({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">{children}</p>;
}

// ─── Shared inline-editable row ──────────────────────────────────────────────
function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-xs text-red-600 font-medium">Delete?</span>
      <button onClick={onConfirm} className="text-red-600 hover:text-red-800 p-0.5" title="Confirm"><Check size={14} /></button>
      <button onClick={onCancel}  className="text-muted-foreground hover:text-foreground p-0.5" title="Cancel"><X size={14} /></button>
    </span>
  );
}

// ─── Countries ────────────────────────────────────────────────────────────────
function CountriesTab() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm] = useState({ name: "", code: "", phoneCode: "", currencyCode: "", currencySymbol: "" });
  const [saving, setSaving]   = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", phoneCode: "", currencyCode: "", currencySymbol: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/geo/countries").then(r => r.json()).then(j => {
      if (j.success) setCountries(j.data);
    }).finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.name.trim() || !form.code.trim()) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/geo/countries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.name} added`);
      setCountries(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", code: "", phoneCode: "", currencyCode: "", currencySymbol: "" });
    } catch { toast.error("Failed to add country"); }
    finally { setSaving(false); }
  }

  function startEdit(c: Country) {
    setEditId(c.id);
    setEditForm({ name: c.name, code: c.code, phoneCode: c.phoneCode ?? "", currencyCode: c.currencyCode ?? "", currencySymbol: c.currencySymbol ?? "" });
    setConfirmDeleteId(null);
  }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim() || !editForm.code.trim()) { toast.error("Name and code are required"); return; }
    setUpdating(true);
    try {
      const res  = await fetch(`/api/geo/countries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Updated");
      setCountries(prev => prev.map(c => c.id === id ? json.data : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditId(null);
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res  = await fetch(`/api/geo/countries/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Deleted");
      setCountries(prev => prev.filter(c => c.id !== id));
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); setConfirmDeleteId(null); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add form */}
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add Country</h3>
          <div>
            <FL>Country name *</FL>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. United States" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL>ISO code * (2 chars)</FL>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="US" maxLength={2} className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
            <div>
              <FL>Phone code</FL>
              <Input value={form.phoneCode} onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))} placeholder="+1" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL>Currency code</FL>
              <Input value={form.currencyCode} onChange={e => setForm(f => ({ ...f, currencyCode: e.target.value.toUpperCase().slice(0, 3) }))} placeholder="USD" maxLength={3} className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
            <div>
              <FL>Currency symbol</FL>
              <Input value={form.currencySymbol} onChange={e => setForm(f => ({ ...f, currencySymbol: e.target.value }))} placeholder="$" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />{saving ? "Adding…" : "Add Country"}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">Countries ({countries.length})</h3>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : countries.length === 0 ? <p className="text-sm text-muted-foreground italic">No countries yet.</p> : (
            <div className="divide-y divide-[#E8EFF6]">
              {countries.map(c => (
                <div key={c.id} className="py-2">
                  {editId === c.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                        <Input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="Code" maxLength={2} className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                        <Input value={editForm.phoneCode} onChange={e => setEditForm(f => ({ ...f, phoneCode: e.target.value }))} placeholder="Phone (+1)" className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                        <Input value={editForm.currencyCode} onChange={e => setEditForm(f => ({ ...f, currencyCode: e.target.value.toUpperCase().slice(0, 3) }))} placeholder="Currency (USD)" maxLength={3} className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                        <Input value={editForm.currencySymbol} onChange={e => setEditForm(f => ({ ...f, currencySymbol: e.target.value }))} placeholder="Symbol ($)" className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(c.id)} disabled={updating} className="h-7 text-xs bg-[#1A3A5C] text-white hover:bg-[#15304d] px-3">
                          <Check size={12} className="mr-1" />{updating ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-7 text-xs px-3">
                          <X size={12} className="mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-[#1A3A5C] font-medium truncate">{c.name} <span className="text-[#6B8FA8] font-normal">({c.code})</span></p>
                        {(c.phoneCode || c.currencyCode) && (
                          <p className="text-xs text-muted-foreground">{[c.phoneCode, c.currencyCode, c.currencySymbol].filter(Boolean).join(" · ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {confirmDeleteId === c.id ? (
                          <ConfirmDelete onConfirm={() => handleDelete(c.id)} onCancel={() => setConfirmDeleteId(null)} />
                        ) : (
                          <>
                            <button onClick={() => startEdit(c)} className="p-1 text-[#6B8FA8] hover:text-[#1A3A5C]" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => setConfirmDeleteId(c.id)} disabled={!!deleting} className="p-1 text-[#6B8FA8] hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────
function StatesTab({ countries }: { countries: Country[] }) {
  const [countryId, setCountryId] = useState("");
  const [states, setStates]       = useState<State[]>([]);
  const [loading, setLoading]     = useState(false);
  const [form, setForm]           = useState({ name: "", code: "" });
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ name: "", code: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [updating, setUpdating]   = useState(false);

  useEffect(() => {
    if (!countryId) { setStates([]); return; }
    setLoading(true);
    fetch(`/api/geo/states?countryId=${countryId}`).then(r => r.json()).then(j => j.success && setStates(j.data)).finally(() => setLoading(false));
  }, [countryId]);

  async function handleAdd() {
    if (!countryId) { toast.error("Select a country"); return; }
    if (!form.name.trim() || !form.code.trim()) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/geo/states", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ countryId, ...form }) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.name} added`);
      setStates(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", code: "" });
    } catch { toast.error("Failed to add state"); }
    finally { setSaving(false); }
  }

  function startEdit(s: State) { setEditId(s.id); setEditForm({ name: s.name, code: s.code }); setConfirmDeleteId(null); }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim() || !editForm.code.trim()) { toast.error("Name and code are required"); return; }
    setUpdating(true);
    try {
      const res  = await fetch(`/api/geo/states/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Updated");
      setStates(prev => prev.map(s => s.id === id ? json.data : s).sort((a, b) => a.name.localeCompare(b.name)));
      setEditId(null);
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res  = await fetch(`/api/geo/states/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Deleted");
      setStates(prev => prev.filter(s => s.id !== id));
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); setConfirmDeleteId(null); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add State / Province</h3>
          <div>
            <FL>Country *</FL>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]"><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FL>State / Province name *</FL>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Washington" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <div>
            <FL>State code *</FL>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. WA" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />{saving ? "Adding…" : "Add State"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">
            {countryId ? `States (${states.length})` : "States — select a country"}
          </h3>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : states.length === 0 ? <p className="text-sm text-muted-foreground italic">{countryId ? "No states yet." : "Select a country to see states."}</p> : (
            <div className="divide-y divide-[#E8EFF6]">
              {states.map(s => (
                <div key={s.id} className="py-2">
                  {editId === s.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                        <Input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Code" className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(s.id)} disabled={updating} className="h-7 text-xs bg-[#1A3A5C] text-white hover:bg-[#15304d] px-3">
                          <Check size={12} className="mr-1" />{updating ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-7 text-xs px-3">
                          <X size={12} className="mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[#1A3A5C] font-medium">{s.name} <span className="text-[#6B8FA8] font-normal">({s.code})</span></p>
                      <div className="flex items-center gap-1 shrink-0">
                        {confirmDeleteId === s.id ? (
                          <ConfirmDelete onConfirm={() => handleDelete(s.id)} onCancel={() => setConfirmDeleteId(null)} />
                        ) : (
                          <>
                            <button onClick={() => startEdit(s)} className="p-1 text-[#6B8FA8] hover:text-[#1A3A5C]" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => setConfirmDeleteId(s.id)} disabled={!!deleting} className="p-1 text-[#6B8FA8] hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Cities ───────────────────────────────────────────────────────────────────
function CitiesTab({ countries }: { countries: Country[] }) {
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId]     = useState("");
  const [states, setStates]       = useState<State[]>([]);
  const [cities, setCities]       = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [form, setForm]           = useState({ name: "" });
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [updating, setUpdating]   = useState(false);

  useEffect(() => {
    if (!countryId) { setStates([]); setStateId(""); setCities([]); return; }
    setLoadingStates(true);
    fetch(`/api/geo/states?countryId=${countryId}`).then(r => r.json()).then(j => j.success && setStates(j.data)).finally(() => setLoadingStates(false));
    setStateId(""); setCities([]);
  }, [countryId]);

  useEffect(() => {
    if (!stateId) { setCities([]); return; }
    setLoadingCities(true);
    fetch(`/api/geo/cities?stateId=${stateId}`).then(r => r.json()).then(j => j.success && setCities(j.data)).finally(() => setLoadingCities(false));
  }, [stateId]);

  async function handleAdd() {
    if (!stateId) { toast.error("Select a state"); return; }
    if (!form.name.trim()) { toast.error("City name is required"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/geo/cities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stateId, name: form.name }) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.name} added`);
      setCities(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "" });
    } catch { toast.error("Failed to add city"); }
    finally { setSaving(false); }
  }

  function startEdit(c: City) { setEditId(c.id); setEditName(c.name); setConfirmDeleteId(null); }

  async function handleUpdate(id: string) {
    if (!editName.trim()) { toast.error("City name is required"); return; }
    setUpdating(true);
    try {
      const res  = await fetch(`/api/geo/cities/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Updated");
      setCities(prev => prev.map(c => c.id === id ? json.data : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditId(null);
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res  = await fetch(`/api/geo/cities/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Deleted");
      setCities(prev => prev.filter(c => c.id !== id));
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); setConfirmDeleteId(null); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add City</h3>
          <div>
            <FL>Country *</FL>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]"><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FL>State / Province *</FL>
            <Select value={stateId} onValueChange={setStateId} disabled={!states.length}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]"><SelectValue placeholder={loadingStates ? "Loading…" : "Select state"} /></SelectTrigger>
              <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FL>City name *</FL>
            <Input value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="e.g. Seattle" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />{saving ? "Adding…" : "Add City"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">
            {stateId ? `Cities (${cities.length})` : "Cities — select a state"}
          </h3>
          {loadingCities ? <p className="text-sm text-muted-foreground">Loading…</p> : cities.length === 0 ? <p className="text-sm text-muted-foreground italic">{stateId ? "No cities yet." : "Select a state to see cities."}</p> : (
            <div className="divide-y divide-[#E8EFF6]">
              {cities.map(c => (
                <div key={c.id} className="py-2">
                  {editId === c.id ? (
                    <div className="flex flex-col gap-2">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="City name" className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(c.id)} disabled={updating} className="h-7 text-xs bg-[#1A3A5C] text-white hover:bg-[#15304d] px-3">
                          <Check size={12} className="mr-1" />{updating ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-7 text-xs px-3">
                          <X size={12} className="mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[#1A3A5C] font-medium">{c.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {confirmDeleteId === c.id ? (
                          <ConfirmDelete onConfirm={() => handleDelete(c.id)} onCancel={() => setConfirmDeleteId(null)} />
                        ) : (
                          <>
                            <button onClick={() => startEdit(c)} className="p-1 text-[#6B8FA8] hover:text-[#1A3A5C]" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => setConfirmDeleteId(c.id)} disabled={!!deleting} className="p-1 text-[#6B8FA8] hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Postal Codes ─────────────────────────────────────────────────────────────
function PostalCodesTab({ countries }: { countries: Country[] }) {
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId]     = useState("");
  const [cityId, setCityId]       = useState("");
  const [states, setStates]       = useState<State[]>([]);
  const [cities, setCities]       = useState<City[]>([]);
  const [postals, setPostals]     = useState<Postal[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPostals, setLoadingPostals] = useState(false);
  const [newCode, setNewCode]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editCode, setEditCode]   = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [updating, setUpdating]   = useState(false);

  useEffect(() => {
    if (!countryId) { setStates([]); setStateId(""); setCities([]); setCityId(""); setPostals([]); return; }
    setLoadingStates(true);
    fetch(`/api/geo/states?countryId=${countryId}`).then(r => r.json()).then(j => j.success && setStates(j.data)).finally(() => setLoadingStates(false));
    setStateId(""); setCities([]); setCityId(""); setPostals([]);
  }, [countryId]);

  useEffect(() => {
    if (!stateId) { setCities([]); setCityId(""); setPostals([]); return; }
    setLoadingCities(true);
    fetch(`/api/geo/cities?stateId=${stateId}`).then(r => r.json()).then(j => j.success && setCities(j.data)).finally(() => setLoadingCities(false));
    setCityId(""); setPostals([]);
  }, [stateId]);

  useEffect(() => {
    if (!cityId) { setPostals([]); return; }
    setLoadingPostals(true);
    fetch(`/api/geo/postal-codes?cityId=${cityId}`).then(r => r.json()).then(j => j.success && setPostals(j.data.map((p: any) => ({ id: p.id, code: p.code })))).finally(() => setLoadingPostals(false));
  }, [cityId]);

  async function handleAdd() {
    if (!cityId) { toast.error("Select a city"); return; }
    if (!newCode.trim()) { toast.error("Postal code is required"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/geo/postal-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stateId, cityId, code: newCode }) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(`${json.data.code} added`);
      setPostals(prev => [...prev, { id: json.data.id, code: json.data.code }].sort((a, b) => a.code.localeCompare(b.code)));
      setNewCode("");
    } catch { toast.error("Failed to add postal code"); }
    finally { setSaving(false); }
  }

  function startEdit(p: Postal) { setEditId(p.id); setEditCode(p.code); setConfirmDeleteId(null); }

  async function handleUpdate(id: string) {
    if (!editCode.trim()) { toast.error("Code is required"); return; }
    setUpdating(true);
    try {
      const res  = await fetch(`/api/geo/postal-codes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: editCode }) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Updated");
      setPostals(prev => prev.map(p => p.id === id ? { id, code: json.data.code } : p).sort((a, b) => a.code.localeCompare(b.code)));
      setEditId(null);
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res  = await fetch(`/api/geo/postal-codes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("Deleted");
      setPostals(prev => prev.filter(p => p.id !== id));
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); setConfirmDeleteId(null); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-[#1A3A5C] text-sm">Add Postal Code</h3>
          <div>
            <FL>Country *</FL>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]"><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FL>State / Province *</FL>
            <Select value={stateId} onValueChange={setStateId} disabled={!states.length}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]"><SelectValue placeholder={loadingStates ? "Loading…" : "Select state"} /></SelectTrigger>
              <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FL>City *</FL>
            <Select value={cityId} onValueChange={setCityId} disabled={!cities.length}>
              <SelectTrigger className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]"><SelectValue placeholder={loadingCities ? "Loading…" : "Select city"} /></SelectTrigger>
              <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FL>Postal code *</FL>
            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. 98101" className="h-9 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            <Plus size={15} className="mr-1.5" />{saving ? "Adding…" : "Add Postal Code"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-[#1A3A5C] text-sm mb-3">
            {cityId ? `Postal Codes (${postals.length})` : "Postal Codes — select a city"}
          </h3>
          {loadingPostals ? <p className="text-sm text-muted-foreground">Loading…</p> : postals.length === 0 ? <p className="text-sm text-muted-foreground italic">{cityId ? "No postal codes yet." : "Select a city to see postal codes."}</p> : (
            <div className="divide-y divide-[#E8EFF6]">
              {postals.map(p => (
                <div key={p.id} className="py-2">
                  {editId === p.id ? (
                    <div className="flex flex-col gap-2">
                      <Input value={editCode} onChange={e => setEditCode(e.target.value)} placeholder="Postal code" className="h-8 text-xs bg-[#F7F9FC] border-[#D1DDE8]" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(p.id)} disabled={updating} className="h-7 text-xs bg-[#1A3A5C] text-white hover:bg-[#15304d] px-3">
                          <Check size={12} className="mr-1" />{updating ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-7 text-xs px-3">
                          <X size={12} className="mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[#1A3A5C] font-medium">{p.code}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {confirmDeleteId === p.id ? (
                          <ConfirmDelete onConfirm={() => handleDelete(p.id)} onCancel={() => setConfirmDeleteId(null)} />
                        ) : (
                          <>
                            <button onClick={() => startEdit(p)} className="p-1 text-[#6B8FA8] hover:text-[#1A3A5C]" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => setConfirmDeleteId(p.id)} disabled={!!deleting} className="p-1 text-[#6B8FA8] hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
        Add, edit, and remove countries, states, cities, and postal codes used in location registration.
      </p>

      <Tabs defaultValue="countries">
        <TabsList className="mb-6 bg-[#E8EFF6]">
          <TabsTrigger value="countries" className="gap-1.5"><Globe size={13} />Countries</TabsTrigger>
          <TabsTrigger value="states"    className="gap-1.5"><MapPin size={13} />States</TabsTrigger>
          <TabsTrigger value="cities"    className="gap-1.5"><Building2 size={13} />Cities</TabsTrigger>
          <TabsTrigger value="postal"    className="gap-1.5"><Hash size={13} />Postal Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="countries"><CountriesTab /></TabsContent>
        <TabsContent value="states"><StatesTab countries={countries} /></TabsContent>
        <TabsContent value="cities"><CitiesTab countries={countries} /></TabsContent>
        <TabsContent value="postal"><PostalCodesTab countries={countries} /></TabsContent>
      </Tabs>
    </div>
  );
}
