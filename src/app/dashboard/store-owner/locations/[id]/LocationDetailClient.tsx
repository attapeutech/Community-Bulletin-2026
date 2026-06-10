"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const editSchema = z.object({
  storeName:    z.string().min(2,  "Store name must be at least 2 characters"),
  storeNumber:  z.string().max(50).optional(),
  displayName:  z.string().optional(),
  addressLine1: z.string().min(5,  "Enter a full street address"),
  addressLine2: z.string().optional(),
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
  city: { name: string }; state: { code: string }; postalCode: { code: string };
};

// Map ad status to shadcn Badge variant + explicit color classes
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

export default function LocationDetailClient({
  location, initialAds, isAdmin,
}: {
  location: Location;
  initialAds: Ad[];
  isAdmin: boolean;
}) {
  const [adList, setAdList] = useState<Ad[]>(initialAds);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editMode, setEditMode] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      storeName:    location.storeName,
      storeNumber:  location.storeNumber ?? "",
      displayName:  location.displayName ?? "",
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2 ?? "",
    },
  });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
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
      showToast("Carousel order saved!", true);
    } catch (e: any) {
      showToast(e.message || "Failed to save order", false);
    } finally {
      setSaving(false);
    }
  }

  async function onEditSubmit(data: EditFormData) {
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Location updated!", true);
      setEditMode(false);
    } catch (e: any) {
      showToast(e.message || "Update failed", false);
    }
  }

  const approvedAds = adList.filter((a) => a.status === "approved");

  const EDIT_FIELDS: { label: string; field: keyof EditFormData }[] = [
    { label: "Store name",               field: "storeName" },
    { label: "Store number",             field: "storeNumber" },
    { label: "Display name (on screen)", field: "displayName" },
    { label: "Address line 1",           field: "addressLine1" },
    { label: "Address line 2",           field: "addressLine2" },
  ];

  return (
    <div className="max-w-[760px]">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-[9999] px-5 py-3 rounded-[10px] text-sm font-medium text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
            toast.ok ? "bg-green-800" : "bg-red-800"
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="mb-6 text-[13px] text-[#6B8FA8]">
        <Link href="/dashboard/store-owner" className="text-[#6B8FA8] no-underline hover:underline">
          {isAdmin ? "All Locations" : "My Locations"}
        </Link>
        {" › "}
        <span className="text-[#1A3A5C]">{location.storeName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A3A5C] mb-1">{location.storeName}</h1>
          <div className="text-[13px] text-[#6B8FA8]">
            {location.addressLine1} · {location.city.name}, {location.state.code} {location.postalCode.code}
          </div>
          <div className="text-[11px] text-[#9DC4E0] mt-1 font-mono">/display/{location.slug}</div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="text-[13px] text-[#4A90C4] border-[#4A90C4] hover:bg-[#4A90C4]/10">
            <Link href={`/display/${location.slug}`} target="_blank">
              View Display ↗
            </Link>
          </Button>
          <Button
            onClick={() => setEditMode(!editMode)}
            className="text-[13px] bg-[#1A3A5C] text-white hover:bg-[#15304d] font-semibold"
          >
            {editMode ? "Cancel Edit" : "Edit Location"}
          </Button>
        </div>
      </div>

      {/* Edit form */}
      {editMode && (
        <Card className="border-[#D8E4EE] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[17px] text-[#1A3A5C]">Edit Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onEditSubmit)} noValidate className="flex flex-col gap-4">
              {EDIT_FIELDS.map(({ label, field }) => (
                <div key={field}>
                  <Label className="mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
                    {label}
                  </Label>
                  <Input
                    {...register(field)}
                    className={cn(
                      "h-10 text-sm text-[#1A3A5C] bg-[#F7F9FC] border-[#D1DDE8]",
                      errors[field] && "border-red-300 bg-red-50"
                    )}
                  />
                  <FieldError msg={errors[field]?.message} />
                </div>
              ))}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-700 text-white hover:bg-green-800"
                >
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
            <p className="text-xs text-[#6B8FA8] mt-1 mb-0">
              {approvedAds.length} approved ad{approvedAds.length !== 1 ? "s" : ""} · Drag ↑↓ to reorder
            </p>
          </div>
          {approvedAds.length > 1 && (
            <Button
              onClick={saveOrder}
              disabled={saving}
              className="bg-[#1A3A5C] text-white hover:bg-[#15304d] text-[13px] font-semibold"
            >
              {saving ? "Saving…" : "Save Order"}
            </Button>
          )}
        </div>

        {approvedAds.length === 0 ? (
          <div className="p-8 text-center text-[#6B8FA8] text-sm">
            No approved ads at this location yet.
          </div>
        ) : (
          <div>
            {adList.filter(a => a.status === "approved").map((ad, idx, arr) => (
              <div
                key={ad.id}
                className={cn(
                  "flex items-center gap-3.5 px-6 py-3",
                  idx < arr.length - 1 && "border-b border-[#D8E4EE]"
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveAd(adList.indexOf(ad), -1)}
                    disabled={idx === 0}
                    className={cn(
                      "w-6 h-6 rounded border border-[#D8E4EE] bg-transparent text-xs leading-none",
                      idx === 0
                        ? "cursor-not-allowed text-[#D8E4EE]"
                        : "cursor-pointer text-[#1A3A5C] hover:bg-[#F7F9FC]"
                    )}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveAd(adList.indexOf(ad), 1)}
                    disabled={idx === arr.length - 1}
                    className={cn(
                      "w-6 h-6 rounded border border-[#D8E4EE] bg-transparent text-xs leading-none",
                      idx === arr.length - 1
                        ? "cursor-not-allowed text-[#D8E4EE]"
                        : "cursor-pointer text-[#1A3A5C] hover:bg-[#F7F9FC]"
                    )}
                  >
                    ▼
                  </button>
                </div>
                <div className="w-6 text-center text-xs text-[#9DC4E0] font-semibold">{idx + 1}</div>
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-16 h-11 object-cover rounded-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1A3A5C]">{ad.title}</div>
                  <div className="text-xs text-[#6B8FA8]">
                    {new Date(ad.startedAt).toLocaleDateString()} – {new Date(ad.endedAt).toLocaleDateString()} · by {ad.user.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All ads table */}
      <Card className="border-[#D8E4EE] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8E4EE]">
          <h2 className="font-serif text-[18px] text-[#1A3A5C] m-0">All Ads at This Location</h2>
          <p className="text-xs text-[#6B8FA8] mt-1 mb-0">{adList.length} total</p>
        </div>
        {adList.length === 0 ? (
          <div className="p-8 text-center text-[#6B8FA8] text-sm">No ads submitted yet.</div>
        ) : (
          adList.map((ad, idx) => {
            const badgeProps = STATUS_BADGE[ad.status] ?? STATUS_BADGE.pending;
            return (
              <div
                key={ad.id}
                className={cn(
                  "flex items-center gap-3.5 px-6 py-3",
                  idx < adList.length - 1 && "border-b border-[#D8E4EE]"
                )}
              >
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-[60px] h-[42px] object-cover rounded-md shrink-0"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#1A3A5C] mb-0.5">{ad.title}</div>
                  <div className="text-xs text-[#6B8FA8]">
                    by {ad.user.name} · {new Date(ad.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={badgeProps.variant} className={badgeProps.className}>
                  {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                </Badge>
                <Link href={`/dashboard/user/ads/${ad.id}`} className="text-xs text-[#4A90C4] no-underline hover:underline">
                  Details
                </Link>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
