"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-700">{msg}</p>;
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
    <div className="max-w-[640px]">
      <a
        href="/dashboard/store-owner"
        className="inline-block mb-6 text-[13px] text-[#6B8FA8] no-underline hover:underline"
      >
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

      <Card className="border-[#D8E4EE]">
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                Store name *
              </Label>
              <Input
                {...register("storeName")}
                placeholder="e.g. Whole Foods Market"
                className={cn(
                  "h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]",
                  errors.storeName && "border-red-300 bg-red-50"
                )}
              />
              <FieldError msg={errors.storeName?.message} />
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                Display name (shown on screen)
              </Label>
              <Input
                {...register("displayName")}
                placeholder="Optional — defaults to store name"
                className="h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]"
              />
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                Address line 1 *
              </Label>
              <Input
                {...register("addressLine1")}
                placeholder="123 Main St"
                className={cn(
                  "h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]",
                  errors.addressLine1 && "border-red-300 bg-red-50"
                )}
              />
              <FieldError msg={errors.addressLine1?.message} />
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                Address line 2
              </Label>
              <Input
                {...register("addressLine2")}
                placeholder="Suite, floor, etc."
                className="h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                  Country *
                </Label>
                <Select
                  value={watch("countryId")}
                  onValueChange={(val) => setValue("countryId", val, { shouldValidate: true })}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]",
                      errors.countryId && "border-red-300 bg-red-50"
                    )}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={errors.countryId?.message} />
              </div>

              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                  State *
                </Label>
                <Select
                  value={watch("stateId")}
                  onValueChange={(val) => setValue("stateId", val, { shouldValidate: true })}
                  disabled={!states.length}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]",
                      errors.stateId && "border-red-300 bg-red-50"
                    )}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={errors.stateId?.message} />
              </div>

              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                  City *
                </Label>
                <Select
                  value={watch("cityId")}
                  onValueChange={(val) => setValue("cityId", val, { shouldValidate: true })}
                  disabled={!cities.length}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]",
                      errors.cityId && "border-red-300 bg-red-50"
                    )}
                  >
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={errors.cityId?.message} />
              </div>

              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                  Postal code *
                </Label>
                <Select
                  value={watch("postalCodeId")}
                  onValueChange={(val) => setValue("postalCodeId", val, { shouldValidate: true })}
                  disabled={!postalCodes.length}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]",
                      errors.postalCodeId && "border-red-300 bg-red-50"
                    )}
                  >
                    <SelectValue placeholder="Select postal code" />
                  </SelectTrigger>
                  <SelectContent>
                    {postalCodes.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={errors.postalCodeId?.message} />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                Currency
              </Label>
              <Select
                value={watch("currency")}
                onValueChange={(val) => setValue("currency", val as FormData["currency"], { shouldValidate: true })}
              >
                <SelectTrigger className="h-10 w-[120px] text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]">
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

            <div className="flex gap-3 justify-end mt-2">
              <Button asChild variant="secondary" className="bg-[#E8EFF6] text-[#1A3A5C] hover:bg-[#d8e4f0]">
                <a href="/dashboard/store-owner">Cancel</a>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1A3A5C] text-white hover:bg-[#15304d]"
              >
                {isSubmitting ? "Creating…" : "Create Location"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
