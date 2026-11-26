import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { refreshAllStoreTaxRates, refreshStoreTaxRate } from "@/lib/store-tax";

const lookupSchema = z.object({ locationId: z.string().uuid().optional() });

// POST /api/admin/tax-rates — look up one store's sales tax rate from WA DOR, or every store's (no locationId)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = lookupSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    const results = parsed.data.locationId
      ? [await refreshStoreTaxRate(parsed.data.locationId)]
      : await refreshAllStoreTaxRates();
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[POST /api/admin/tax-rates]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const manualSchema = z.object({
  locationId: z.string().uuid(),
  // null clears it: no tax charged at this store
  ratePercent: z.number().min(0).max(20).nullable(),
  areaName: z.string().trim().max(80).optional(),
  locationCode: z.string().trim().max(10).optional(),
});

// PATCH /api/admin/tax-rates — set a store's rate by hand (when DOR can't place the address)
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = manualSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    const d = parsed.data;
    const now = new Date();
    await db.update(locations).set(d.ratePercent === null || d.ratePercent === 0
      ? { taxRateBps: null, taxLocationCode: null, taxAreaName: null, taxRatePeriod: null, taxRateCheckedAt: now, updatedAt: now }
      : {
          taxRateBps: Math.round(d.ratePercent * 100),
          taxAreaName: d.areaName || null,
          taxLocationCode: d.locationCode || null,
          taxRatePeriod: "manual",
          taxRateCheckedAt: now,
          updatedAt: now,
        }).where(eq(locations.id, d.locationId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/tax-rates]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
