import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { locations, countries, states, cities, postalCodes, users } from "@/lib/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import slugify from "slugify";
import { nanoid } from "nanoid";

// ─── GET /api/locations ───────────────────────────────────────────────────────
// Public search (for ad submission location picker).
// If ?mine=true + authenticated store_owner/admin → returns own / all locations.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const countryId = searchParams.get("countryId");
  const stateId = searchParams.get("stateId");
  const cityId = searchParams.get("cityId");
  const search = searchParams.get("search");

  try {
    const conditions: ReturnType<typeof eq>[] = [eq(locations.isActive, true)];

    if (mine) {
      const session = await getSession();
      if (session) {
        const role = (session.user as any).role as string;
        const userId = (session.user as any).id as string;
        // Admin sees all; store_owner sees own
        if (role === "store_owner") conditions.push(eq(locations.storeOwnerId, userId));
        // admin: no owner filter → sees all
      }
    }

    if (countryId) conditions.push(eq(locations.countryId, countryId));
    if (stateId) conditions.push(eq(locations.stateId, stateId));
    if (cityId) conditions.push(eq(locations.cityId, cityId));
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(locations.storeName, term),
          ilike(locations.addressLine1, term),
          ilike(cities.name, term),
          ilike(states.name, term),
          ilike(states.code, term),
        ) as ReturnType<typeof eq>
      );
    }

    const results = await db
      .select({
        id: locations.id,
        storeName: locations.storeName,
        addressLine1: locations.addressLine1,
        addressLine2: locations.addressLine2,
        slug: locations.slug,
        displayName: locations.displayName,
        currency: locations.currency,
        isActive: locations.isActive,
        createdAt: locations.createdAt,
        storeOwner: { id: users.id, name: users.name, email: users.email },
        country: { id: countries.id, name: countries.name, code: countries.code },
        state: { id: states.id, name: states.name, code: states.code },
        city: { id: cities.id, name: cities.name },
        postalCode: { id: postalCodes.id, code: postalCodes.code },
      })
      .from(locations)
      .innerJoin(users, eq(locations.storeOwnerId, users.id))
      .innerJoin(countries, eq(locations.countryId, countries.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
      .where(and(...conditions))
      .limit(100);

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error("[GET /api/locations]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST /api/locations ──────────────────────────────────────────────────────
const createSchema = z.object({
  storeName: z.string().min(2).max(120),
  storeNumber: z.string().max(50).optional(),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(100).optional(),
  displayName: z.string().max(120).optional(),
  countryId: z.string().uuid(),
  stateId: z.string().uuid(),
  cityId: z.string().uuid(),
  postalCodeId: z.string().uuid(),
  currency: z.string().length(3).default("USD"),
  pricePerWeekCents: z.number().int().min(100).max(1000000).default(10000),
  equipmentProvided: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  logoUrl: z.string().url().optional(),
  businessHours: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role as string;
    if (role !== "store_owner" && role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createSchema.parse(body);
    const userId = (session.user as any).id as string;

    // Generate a unique slug from store name + short id
    const baseSlug = slugify(data.storeName, { lower: true, strict: true });
    const slug = `${baseSlug}-${nanoid(6)}`;

    const [location] = await db.insert(locations).values({
      storeOwnerId: userId,
      storeName: data.storeName,
      storeNumber: data.storeNumber ?? null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      displayName: data.displayName ?? null,
      countryId: data.countryId,
      stateId: data.stateId,
      cityId: data.cityId,
      postalCodeId: data.postalCodeId,
      currency: data.currency,
      slug,
      isActive: true,
      pricePerWeekCents: data.pricePerWeekCents,
      equipmentProvided: data.equipmentProvided,
      description: data.description ?? null,
      category: data.category ?? null,
      logoUrl: data.logoUrl ?? null,
      businessHours: data.businessHours ?? null,
    }).returning();

    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 422 });
    }
    console.error("[POST /api/locations]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
