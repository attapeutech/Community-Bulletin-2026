"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  storeName:         z.string().min(2,  "Store name must be at least 2 characters"),
  storeNumber:       z.string().max(50).optional(),
  displayName:       z.string().optional(),
  addressLine1:      z.string().min(5,  "Enter a full street address"),
  addressLine2:      z.string().optional(),
  countryId:         z.string().min(1,  "Select a country"),
  stateId:           z.string().min(1,  "Select a state"),
  cityId:            z.string().min(1,  "Select a city"),
  postalCodeId:      z.string().min(1,  "Select a postal code"),
  currency:          z.enum(["USD", "CAD", "GBP", "EUR"]),
  pricePerWeekCents: z.number().int().min(100, "Minimum $1/week").max(1000000),
  equipmentProvided: z.boolean(),
  description:       z.string().max(1000).optional(),
  category:          z.string().max(100).optional(),
  businessHours:     z.string().max(500).optional(),
  logoUrl:           z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-700">{msg}</p>;
}

type Option = { id: string; name: string };

export default function NewLocationPage() {
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "USD",
      pricePerWeekCents: 10000,
      equipmentProvided: false,
    },
  });

  const [submitError, setSubmitError] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [countries, setCountries] = useState<(Option & { code: string })[]>([]);
  const [states,    setStates]    = useState<Option[]>([]);
  const [cities,    setCities]    = useState<Option[]>([]);
  const [postalCodes, setPostalCodes] = useState<(Option & { code: string })[]>([]);

  const watchedCountry    = watch("countryId");
  const watchedState      = watch("stateId");
  const watchedCity       = watch("cityId");
  const equipmentProvided = watch("equipmentProvided");
  const priceWatch        = watch("pricePerWeekCents");

  useEffect(() => {
    fetch("/api/geo/countries").then(r => r.json()).then(j => j.success && setCountries(j.data));
  }, []);

  useEffect(() => {
    if (!watchedCountry) return;
    setStates([]); setCities([]); setPostalCodes([]);
    setValue("stateId", ""); setValue("cityId", ""); setValue("postalCodeId", "");
    fetch(`/api/geo/states?countryId=${watchedCountry}`).then(r => r.json()).then(j => j.success && setStates(j.data));
  }, [watchedCountry, setValue]);

  useEffect(() => {
    if (!watchedState) return;
    setCities([]); setPostalCodes([]);
    setValue("cityId", ""); setValue("postalCodeId", "");
    fetch(`/api/geo/cities?stateId=${watchedState}`).then(r => r.json()).then(j => j.success && setCities(j.data));
  }, [watchedState, setValue]);

  useEffect(() => {
    if (!watchedCity) return;
    setPostalCodes([]);
    setValue("postalCodeId", "");
    fetch(`/api/geo/postal-codes?cityId=${watchedCity}`).then(r => r.json()).then(j => j.success && setPostalCodes(j.data));
  }, [watchedCity, setValue]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "locations");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setLogoUrl(json.data.publicUrl);
      setValue("logoUrl", json.data.publicUrl);
    } catch (e: any) {
      setSubmitError(e.message || "Logo upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: FormData) {
    setSubmitError("");
    try {
      const payload = { ...data, logoUrl: logoUrl || undefined };
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push("/dashboard/store-owner");
    } catch (e: any) {
      setSubmitError(e.message || "Failed to create location");
    }
  }

  return (
    <div className="max-w-[680px] w-full">
      <a href="/dashboard/store-owner" className="inline-block mb-6 text-[13px] text-[#6B8FA8] no-underline hover:underline">
        ← Back to locations
      </a>
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1">Add Location</h1>
      <p className="text-[#6B8FA8] text-sm mb-8">
        Register a store location where ads will be displayed on screen.
      </p>

      {submitError && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">

        {/* ── Store Info ── */}
        <Card className="border-[#D8E4EE]">
          <CardContent className="pt-6 flex flex-col gap-5">
            <p className="text-[11px] font-semibold text-[#6B8FA8] uppercase tracking-wider -mb-2">Store Information</p>

            {/* Logo upload */}
            <div>
              <Label className="mb-2 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Logo</Label>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl bg-[#F0F7FF] border-2 border-dashed border-[#D1DDE8] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#4A90C4] transition-colors"
                  onClick={() => logoRef.current?.click()}
                >
                  {logoUrl
                    ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl">🏪</span>
                  }
                </div>
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploading} className="text-xs">
                    {uploading ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
                  </Button>
                  <p className="text-[10px] text-[#9DC4E0] mt-1">JPG, PNG or WebP · max 10 MB</p>
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Store name *</Label>
              <Input {...register("storeName")} placeholder="e.g. Whole Foods Market"
                className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.storeName && "border-red-300 bg-red-50")} />
              <FieldError msg={errors.storeName?.message} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Store number</Label>
                <Input {...register("storeNumber")} placeholder="e.g. Store #42, Unit 5B" className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Display name (on screen)</Label>
                <Input {...register("displayName")} placeholder="Optional — defaults to store name" className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Category</Label>
              <Input {...register("category")} placeholder="e.g. Grocery, Coffee Shop, Gym, Pharmacy…" className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Description</Label>
              <textarea {...register("description")} rows={3}
                placeholder="Tell advertisers about your store, daily foot traffic, target audience…"
                className="w-full rounded-md border border-[#D1DDE8] bg-[#F7F9FC] px-3 py-2 text-sm text-[#1A3A5C] resize-none focus:outline-none focus:ring-2 focus:ring-[#4A90C4]/40" />
            </div>
          </CardContent>
        </Card>

        {/* ── Address ── */}
        <Card className="border-[#D8E4EE]">
          <CardContent className="pt-6 flex flex-col gap-5">
            <p className="text-[11px] font-semibold text-[#6B8FA8] uppercase tracking-wider -mb-2">Location &amp; Address</p>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Address line 1 *</Label>
              <Input {...register("addressLine1")} placeholder="123 Main St"
                className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.addressLine1 && "border-red-300 bg-red-50")} />
              <FieldError msg={errors.addressLine1?.message} />
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Address line 2</Label>
              <Input {...register("addressLine2")} placeholder="Suite, floor, etc." className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Country *</Label>
                <Select value={watch("countryId")} onValueChange={(val) => setValue("countryId", val, { shouldValidate: true })}>
                  <SelectTrigger className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.countryId && "border-red-300 bg-red-50")}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>{countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError msg={errors.countryId?.message} />
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">State *</Label>
                <Select value={watch("stateId")} onValueChange={(val) => setValue("stateId", val, { shouldValidate: true })} disabled={!states.length}>
                  <SelectTrigger className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.stateId && "border-red-300 bg-red-50")}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError msg={errors.stateId?.message} />
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">City *</Label>
                <Select value={watch("cityId")} onValueChange={(val) => setValue("cityId", val, { shouldValidate: true })} disabled={!cities.length}>
                  <SelectTrigger className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.cityId && "border-red-300 bg-red-50")}>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError msg={errors.cityId?.message} />
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Postal code *</Label>
                <Select value={watch("postalCodeId")} onValueChange={(val) => setValue("postalCodeId", val, { shouldValidate: true })} disabled={!postalCodes.length}>
                  <SelectTrigger className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.postalCodeId && "border-red-300 bg-red-50")}>
                    <SelectValue placeholder="Select postal code" />
                  </SelectTrigger>
                  <SelectContent>{postalCodes.map(p => <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError msg={errors.postalCodeId?.message} />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Business hours</Label>
              <textarea {...register("businessHours")} rows={3}
                placeholder={"Mon–Fri: 8am–9pm\nSat–Sun: 9am–7pm"}
                className="w-full rounded-md border border-[#D1DDE8] bg-[#F7F9FC] px-3 py-2 text-sm text-[#1A3A5C] resize-none focus:outline-none focus:ring-2 focus:ring-[#4A90C4]/40" />
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Currency</Label>
              <Select value={watch("currency")} onValueChange={(val) => setValue("currency", val as FormData["currency"], { shouldValidate: true })}>
                <SelectTrigger className="h-10 w-[120px] text-sm bg-[#F7F9FC] border-[#D1DDE8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Pricing & Equipment ── */}
        <Card className="border-[#D8E4EE]">
          <CardContent className="pt-6 flex flex-col gap-5">
            <p className="text-[11px] font-semibold text-[#6B8FA8] uppercase tracking-wider -mb-2">Pricing &amp; Revenue Share</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                  Ad price per week *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8FA8] text-sm">$</span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={Math.round(priceWatch / 100)}
                    onChange={(e) => setValue("pricePerWeekCents", Math.round(Number(e.target.value) * 100), { shouldValidate: true })}
                    className={cn("h-10 pl-6 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.pricePerWeekCents && "border-red-300 bg-red-50")}
                  />
                </div>
                <FieldError msg={errors.pricePerWeekCents?.message} />
                <p className="text-[10px] text-[#9DC4E0] mt-1">This is what advertisers pay per week to display their ad here.</p>
              </div>

              <div>
                <Label className="mb-2 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                  Equipment &amp; Setup
                </Label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("equipmentProvided")}
                    className="mt-0.5 w-4 h-4 rounded border-[#D1DDE8] accent-[#1A3A5C]"
                  />
                  <span className="text-sm text-[#1A3A5C]">
                    I provide TV screen, Wi-Fi &amp; hardware installation
                  </span>
                </label>
                <div className={cn("mt-3 rounded-lg p-3 text-[12px]", equipmentProvided ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>
                  {equipmentProvided
                    ? "You earn 50% of ad revenue — thank you for providing the equipment!"
                    : "You earn 25% of ad revenue. Check the box above if you also provide the display equipment to earn 50%."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="secondary" className="bg-[#E8EFF6] text-[#1A3A5C] hover:bg-[#d8e4f0]">
            <a href="/dashboard/store-owner">Cancel</a>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#1A3A5C] text-white hover:bg-[#15304d]">
            {isSubmitting ? "Creating…" : "Create Location"}
          </Button>
        </div>
      </form>
    </div>
  );
}
