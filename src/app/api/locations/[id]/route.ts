import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { locations, states, cities, postalCodes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
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
      .set({ ...data, updatedAt: new Date() })
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
