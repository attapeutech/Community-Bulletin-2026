import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { locations, states, cities, postalCodes, ads, payments, ownerEarnings } from "@/lib/db/schema";
import { and, eq, count } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { MIN_PRICE_PER_WEEK_CENTS, MAX_PRICE_PER_WEEK_CENTS, MAX_SHARE_RATE_BPS } from "@/types";

const updateSchema = z.object({
  storeName: z.string().min(2).max(120).optional(),
  storeNumber: z.string().max(50).nullable().optional(),
  addressLine1: z.string().min(5).max(200).optional(),
  addressLine2: z.string().max(100).nullable().optional(),
  displayName: z.string().max(120).nullable().optional(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
  // Country / state / city / ZIP are sent together
  countryId: z.string().uuid().optional(),
  stateId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  postalCodeId: z.string().uuid().optional(),
  // Admin-only fields (stripped for store owners below)
  pricePerWeekCents: z.number().int().min(MIN_PRICE_PER_WEEK_CENTS).max(MAX_PRICE_PER_WEEK_CENTS).optional(),
  shareRateBps: z.number().int().min(0).max(MAX_SHARE_RATE_BPS).optional(),
  equipmentProvided: z.boolean().optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  businessHours: z.string().max(500).nullable().optional(),
  dailyCustomers: z.number().int().min(0).max(1_000_000).nullable().optional(),
});

// PATCH /api/locations/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role as string;
    const userId = (session.user as any).id as string;
    const { id } = await params;

    const [location] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    if (!location) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Only owner or admin can edit
    if (role !== "admin" && location.storeOwnerId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    // Pricing and revenue share are set by CommunityBulletin, not the store owner
    if (role !== "admin") {
      delete data.pricePerWeekCents;
      delete data.shareRateBps;
      delete data.equipmentProvided;
      delete data.dailyCustomers;
    }

    // Make sure the new place is consistent: ZIP in the city, city in the state, state in the country
    const geo = [data.countryId, data.stateId, data.cityId, data.postalCodeId];
    if (geo.some(Boolean)) {
      if (!geo.every(Boolean)) {
        return NextResponse.json({ success: false, error: "Country, state, city and postal code are all required" }, { status: 422 });
      }
      const [match] = await db
        .select({ id: postalCodes.id })
        .from(postalCodes)
        .innerJoin(cities, eq(postalCodes.cityId, cities.id))
        .innerJoin(states, eq(cities.stateId, states.id))
        .where(and(
          eq(postalCodes.id, data.postalCodeId!),
          eq(cities.id, data.cityId!),
          eq(states.id, data.stateId!),
          eq(states.countryId, data.countryId!),
        ))
        .limit(1);
      if (!match) {
        return NextResponse.json({ success: false, error: "That postal code doesn't match the selected city and state" }, { status: 422 });
      }
    }

    const [updated] = await db
      .update(locations)
      .set({
        ...data,
        // Date the traffic figure so advertisers see how current it is
        ...(data.dailyCustomers !== undefined && data.dailyCustomers !== location.dailyCustomers
          ? { trafficUpdatedAt: data.dailyCustomers === null ? null : new Date() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 422 });
    }
    console.error("[PATCH /api/locations/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/locations/[id] — admin only. Allowed only when no money ever moved through the
// location (no payments, no owner earnings); its unpaid draft ads go with it. Otherwise the
// records are kept and the admin is told to deactivate it instead.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;

    const [location] = await db.select({ id: locations.id }).from(locations).where(eq(locations.id, id)).limit(1);
    if (!location) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const [{ paid }] = await db
      .select({ paid: count() })
      .from(payments)
      .innerJoin(ads, eq(payments.adId, ads.id))
      .where(eq(ads.locationId, id));
    const [{ earned }] = await db.select({ earned: count() }).from(ownerEarnings).where(eq(ownerEarnings.locationId, id));
    if (paid > 0 || earned > 0) {
      return NextResponse.json({
        success: false,
        error: "This location has payment or earnings history, so it can't be deleted. Deactivate it instead to take it off screens and posting.",
      }, { status: 409 });
    }

    // Saved-ad and notification rows for these ads are removed by their cascades
    const deletedAds = await db.transaction(async (tx) => {
      const removed = await tx.delete(ads).where(eq(ads.locationId, id)).returning({ id: ads.id });
      await tx.delete(locations).where(eq(locations.id, id));
      return removed.length;
    });

    return NextResponse.json({ success: true, data: { deletedAds } });
  } catch (error: any) {
    console.error("[DELETE /api/locations/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
