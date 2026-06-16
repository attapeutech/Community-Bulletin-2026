"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const editSchema = z.object({
  storeName:         z.string().min(2, "Store name must be at least 2 characters"),
  storeNumber:       z.string().max(50).optional(),
  displayName:       z.string().optional(),
  addressLine1:      z.string().min(5, "Enter a full street address"),
  addressLine2:      z.string().optional(),
  pricePerWeekCents: z.number().int().min(100, "Minimum $1/week").max(1000000),
  equipmentProvided: z.boolean(),
  description:       z.string().max(1000).optional(),
  category:          z.string().max(100).optional(),
  businessHours:     z.string().max(500).optional(),
  logoUrl:           z.string().optional(),
});
type EditFormData = z.infer<typeof editSchema>;

type Ad = {
  id: string; title: string; imageUrl: string; status: string;
  paymentStatus: string; displayOrder: number;
  startedAt: string; endedAt: string; createdAt: string;
  user: { id: string; name: string; email: string };
};

type Location = {
  id: string; storeName: string; storeNumber: string | null;
  addressLine1: string; addressLine2: string | null; displayName: string | null;
  slug: string; currency: string; isActive: boolean;
  pricePerWeekCents: number; equipmentProvided: boolean;
  description: string | null; category: string | null;
  logoUrl: string | null; businessHours: string | null;
  city: { name: string }; state: { code: string }; postalCode: { code: string };
};

const STATUS_BADGE: Record<string, { variant: "outline"; className: string }> = {
  pending:   { variant: "outline", className: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  approved:  { variant: "outline", className: "bg-green-50 text-green-800 border-green-200" },
  denied:    { variant: "outline", className: "bg-red-50 text-red-800 border-red-200" },
  expired:   { variant: "outline", className: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { variant: "outline", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-700">{msg}</p>;
}

function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function DisplayScreenCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const displayUrl = `${appUrl}/display/${slug}`;

  function copyUrl() {
    navigator.clipboard.writeText(displayUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="border-[#D8E4EE] mb-6 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#D8E4EE]">
        <h2 className="font-serif text-[18px] text-[#1A3A5C] m-0">Display Screen Setup</h2>
        <p className="text-xs text-[#4A6B82] mt-1 mb-0">
          Open this URL on your TV browser, or scan the QR code to launch the display.
        </p>
      </div>
      <div className="px-6 py-5 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* QR code */}
        <div className="shrink-0 bg-white p-3 rounded-xl border border-[#D8E4EE] shadow-sm">
          <QRCodeSVG value={displayUrl} size={128} bgColor="#ffffff" fgColor="#1A3A5C" level="M" />
        </div>
        {/* URL + instructions */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-[#4A6B82] uppercase tracking-wider mb-2">Display URL</div>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 text-[13px] font-mono text-[#1A3A5C] bg-[#F0F7FF] border border-[#D8E4EE] rounded-lg px-3 py-2 truncate block">
              {displayUrl}
            </code>
            <button
              onClick={copyUrl}
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border border-[#D1DDE8] bg-white text-[#1A3A5C] hover:bg-[#F0F7FF] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-[12px] text-[#4A6B82]">
            <div className="flex items-start gap-2"><span className="text-[#4A90C4] font-bold mt-0.5">1.</span> On your TV, open a web browser (Chrome, Edge, or Firefox)</div>
            <div className="flex items-start gap-2"><span className="text-[#4A90C4] font-bold mt-0.5">2.</span> Navigate to the URL above, or scan the QR code with a phone and follow the link</div>
            <div className="flex items-start gap-2"><span className="text-[#4A90C4] font-bold mt-0.5">3.</span> Press <kbd className="text-[10px] bg-[#F0F7FF] border border-[#D8E4EE] rounded px-1.5 py-0.5 font-mono">F11</kbd> for fullscreen — ads will rotate automatically</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function LocationDetailClient({
  location, initialAds, isAdmin,
}: {
  location: Location;
  initialAds: Ad[];
  isAdmin: boolean;
}) {
  const [adList, setAdList] = useState<Ad[]>(initialAds);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [logoUrl, setLogoUrl] = useState(location.logoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      storeName:         location.storeName,
      storeNumber:       location.storeNumber ?? "",
      displayName:       location.displayName ?? "",
      addressLine1:      location.addressLine1,
      addressLine2:      location.addressLine2 ?? "",
      pricePerWeekCents: location.pricePerWeekCents,
      equipmentProvided: location.equipmentProvided,
      description:       location.description ?? "",
      category:          location.category ?? "",
      businessHours:     location.businessHours ?? "",
      logoUrl:           location.logoUrl ?? "",
    },
  });

  const equipmentProvided = watch("equipmentProvided");
  // price in dollars for display in input
  const priceWatch = watch("pricePerWeekCents");

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
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function moveAd(index: number, dir: -1 | 1) {
    const next = [...adList];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setAdList(next.map((a, i) => ({ ...a, displayOrder: i })));
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const order = adList.map((a, i) => ({ adId: a.id, displayOrder: i }));
      const res = await fetch(`/api/locations/${location.id}/ads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Carousel order saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  async function onEditSubmit(data: EditFormData) {
    try {
      const payload = { ...data, logoUrl: logoUrl || null };
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Location updated!");
      setEditMode(false);
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  }

  const approvedAds = adList.filter((a) => a.status === "approved");
  const shareRate = location.equipmentProvided ? "50%" : "25%";

  return (
    <div className="max-w-[800px]">
      {/* Breadcrumb */}
      <div className="mb-6 text-[13px] text-[#4A6B82]">
        <Link href="/dashboard/store-owner" className="text-[#4A6B82] no-underline hover:underline">
          {isAdmin ? "All Locations" : "My Locations"}
        </Link>
        {" › "}
        <span className="text-[#1A3A5C]">{location.storeName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-14 h-14 rounded-xl bg-[#F0F7FF] flex items-center justify-center shrink-0 overflow-hidden">
            {location.logoUrl
              ? <img src={location.logoUrl} alt={location.storeName} className="w-full h-full object-cover" />
              : <span className="text-2xl">🏪</span>
            }
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1A3A5C] mb-1">{location.storeName}</h1>
            <div className="text-[13px] text-[#4A6B82]">
              {location.addressLine1} · {location.city.name}, {location.state.code} {location.postalCode.code}
            </div>
            <div className="text-[11px] text-[#5B7D96] mt-1 font-mono">/display/{location.slug}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" className="text-[13px] text-[#4A90C4] border-[#4A90C4] hover:bg-[#4A90C4]/10">
            <Link href={`/display/${location.slug}`} target="_blank">View Display ↗</Link>
          </Button>
          <Button asChild variant="outline" className="text-[13px]">
            <Link href={`/stores/${location.slug}`} target="_blank">Public Page ↗</Link>
          </Button>
          <Button
            onClick={() => setEditMode(!editMode)}
            className="text-[13px] bg-[#1A3A5C] text-white hover:bg-[#15304d] font-semibold"
          >
            {editMode ? "Cancel Edit" : "Edit Location"}
          </Button>
        </div>
      </div>

      {/* Info cards row */}
      {!editMode && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-4">
            <div className="text-[10px] font-semibold text-[#4A6B82] uppercase tracking-wider mb-1">Price / Week</div>
            <div className="text-lg font-bold text-[#1A3A5C]">{formatCents(location.pricePerWeekCents, location.currency)}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-4">
            <div className="text-[10px] font-semibold text-[#4A6B82] uppercase tracking-wider mb-1">Revenue Share</div>
            <div className={cn("text-lg font-bold", location.equipmentProvided ? "text-green-700" : "text-amber-700")}>
              {shareRate}
            </div>
            <div className="text-[10px] text-[#5B7D96] mt-0.5">{location.equipmentProvided ? "equipment provided" : "platform equipment"}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-4">
            <div className="text-[10px] font-semibold text-[#4A6B82] uppercase tracking-wider mb-1">Active Ads</div>
            <div className="text-lg font-bold text-[#1A3A5C]">{approvedAds.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-4">
            <div className="text-[10px] font-semibold text-[#4A6B82] uppercase tracking-wider mb-1">Category</div>
            <div className="text-sm font-semibold text-[#1A3A5C] truncate">{location.category || "—"}</div>
          </div>
        </div>
      )}

      {/* Display Screen Link + QR Code */}
      {!editMode && (
        <DisplayScreenCard slug={location.slug} />
      )}

      {/* Edit form */}
      {editMode && (
        <Card className="border-[#D8E4EE] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[17px] text-[#1A3A5C]">Edit Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onEditSubmit)} noValidate className="flex flex-col gap-5">

              {/* Logo upload */}
              <div>
                <Label className="mb-2 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                  Logo
                </Label>
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
                    <p className="text-[10px] text-[#5B7D96] mt-1">JPG, PNG or WebP · max 10 MB</p>
                  </div>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Store name *</Label>
                  <Input {...register("storeName")} className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.storeName && "border-red-300 bg-red-50")} />
                  <FieldError msg={errors.storeName?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Store number</Label>
                  <Input {...register("storeNumber")} className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Display name (shown on screen)</Label>
                <Input {...register("displayName")} className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" placeholder="Optional — defaults to store name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Address line 1 *</Label>
                  <Input {...register("addressLine1")} className={cn("h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]", errors.addressLine1 && "border-red-300 bg-red-50")} />
                  <FieldError msg={errors.addressLine1?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Address line 2</Label>
                  <Input {...register("addressLine2")} className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" placeholder="Suite, floor, etc." />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Category</Label>
                <Input {...register("category")} className="h-10 text-sm bg-[#F7F9FC] border-[#D1DDE8]" placeholder="e.g. Grocery, Coffee Shop, Gym…" />
              </div>

              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Description</Label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Brief description of your store, foot traffic, audience…"
                  className="w-full rounded-md border border-[#D1DDE8] bg-[#F7F9FC] px-3 py-2 text-sm text-[#1A3A5C] resize-none focus:outline-none focus:ring-2 focus:ring-[#4A90C4]/40"
                />
              </div>

              <div>
                <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">Business hours</Label>
                <textarea
                  {...register("businessHours")}
                  rows={3}
                  placeholder={"Mon–Fri: 8am–9pm\nSat–Sun: 9am–7pm"}
                  className="w-full rounded-md border border-[#D1DDE8] bg-[#F7F9FC] px-3 py-2 text-sm text-[#1A3A5C] resize-none focus:outline-none focus:ring-2 focus:ring-[#4A90C4]/40"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F9FC] rounded-xl p-4 border border-[#D8E4EE]">
                <div>
                  <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                    Price per week ($) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B82] text-sm">$</span>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={Math.round(priceWatch / 100)}
                      onChange={(e) => setValue("pricePerWeekCents", Math.round(Number(e.target.value) * 100), { shouldValidate: true })}
                      className={cn("h-10 pl-6 text-sm bg-white border-[#D1DDE8]", errors.pricePerWeekCents && "border-red-300 bg-red-50")}
                    />
                  </div>
                  <FieldError msg={errors.pricePerWeekCents?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                    Equipment & Setup
                  </Label>
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      {...register("equipmentProvided")}
                      className="w-4 h-4 rounded border-[#D1DDE8] accent-[#1A3A5C]"
                    />
                    <span className="text-sm text-[#1A3A5C]">
                      I provide TV, Wi-Fi &amp; hardware
                      <span className={cn("ml-2 text-xs font-semibold", equipmentProvided ? "text-green-700" : "text-amber-700")}>
                        ({equipmentProvided ? "50% share" : "25% share"})
                      </span>
                    </span>
                  </label>
                  <p className="text-[10px] text-[#5B7D96] mt-1.5">
                    {equipmentProvided
                      ? "Great — you earn 50% of all ad revenue at this location."
                      : "Platform provides equipment — you earn 25% of ad revenue."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-green-700 text-white hover:bg-green-800">
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Carousel order */}
      <Card className="border-[#D8E4EE] mb-6 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#D8E4EE]">
          <div>
            <h2 className="font-serif text-[18px] text-[#1A3A5C] m-0">Carousel Order</h2>
            <p className="text-xs text-[#4A6B82] mt-1 mb-0">
              {approvedAds.length} approved ad{approvedAds.length !== 1 ? "s" : ""} · Use ↑↓ to reorder
            </p>
          </div>
          {approvedAds.length > 1 && (
            <Button onClick={saveOrder} disabled={saving} className="bg-[#1A3A5C] text-white hover:bg-[#15304d] text-[13px] font-semibold">
              {saving ? "Saving…" : "Save Order"}
            </Button>
          )}
        </div>

        {approvedAds.length === 0 ? (
          <div className="p-8 text-center text-[#4A6B82] text-sm">No approved ads at this location yet.</div>
        ) : (
          <div>
            {adList.filter(a => a.status === "approved").map((ad, idx, arr) => (
              <div key={ad.id} className={cn("flex items-center gap-3.5 px-6 py-3", idx < arr.length - 1 && "border-b border-[#D8E4EE]")}>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveAd(adList.indexOf(ad), -1)}
                    disabled={idx === 0}
                    className={cn("w-6 h-6 rounded border border-[#D8E4EE] bg-transparent text-xs leading-none", idx === 0 ? "cursor-not-allowed text-[#D8E4EE]" : "cursor-pointer text-[#1A3A5C] hover:bg-[#F7F9FC]")}
                  >▲</button>
                  <button
                    onClick={() => moveAd(adList.indexOf(ad), 1)}
                    disabled={idx === arr.length - 1}
                    className={cn("w-6 h-6 rounded border border-[#D8E4EE] bg-transparent text-xs leading-none", idx === arr.length - 1 ? "cursor-not-allowed text-[#D8E4EE]" : "cursor-pointer text-[#1A3A5C] hover:bg-[#F7F9FC]")}
                  >▼</button>
                </div>
                <div className="w-6 text-center text-xs text-[#5B7D96] font-semibold">{idx + 1}</div>
                <img src={ad.imageUrl} alt={ad.title} className="w-16 h-11 object-cover rounded-md shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1A3A5C]">{ad.title}</div>
                  <div className="text-xs text-[#4A6B82]">
                    {new Date(ad.startedAt).toLocaleDateString()} – {new Date(ad.endedAt).toLocaleDateString()} · by {ad.user.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All ads */}
      <Card className="border-[#D8E4EE] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8E4EE]">
          <h2 className="font-serif text-[18px] text-[#1A3A5C] m-0">All Ads at This Location</h2>
          <p className="text-xs text-[#4A6B82] mt-1 mb-0">{adList.length} total</p>
        </div>
        {adList.length === 0 ? (
          <div className="p-8 text-center text-[#4A6B82] text-sm">No ads submitted yet.</div>
        ) : (
          adList.map((ad, idx) => {
            const badgeProps = STATUS_BADGE[ad.status] ?? STATUS_BADGE.pending;
            return (
              <div key={ad.id} className={cn("flex items-center gap-3.5 px-6 py-3", idx < adList.length - 1 && "border-b border-[#D8E4EE]")}>
                <img src={ad.imageUrl} alt={ad.title} className="w-[60px] h-[42px] object-cover rounded-md shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1A3A5C] mb-0.5">{ad.title}</div>
                  <div className="text-xs text-[#4A6B82]">by {ad.user.name} · {new Date(ad.createdAt).toLocaleDateString()}</div>
                </div>
                <Badge variant={badgeProps.variant} className={badgeProps.className}>
                  {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                </Badge>
                <Link href={`/dashboard/user/ads/${ad.id}`} className="text-xs text-[#4A90C4] no-underline hover:underline shrink-0">Details</Link>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
