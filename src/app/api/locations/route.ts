import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { locations, countries, states, cities, postalCodes } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countryId = searchParams.get("countryId");
  const stateId = searchParams.get("stateId");
  const cityId = searchParams.get("cityId");
  const search = searchParams.get("search");

  try {
    const conditions = [eq(locations.isActive, true)];
    if (countryId) conditions.push(eq(locations.countryId, countryId));
    if (stateId) conditions.push(eq(locations.stateId, stateId));
    if (cityId) conditions.push(eq(locations.cityId, cityId));
    if (search) conditions.push(ilike(locations.storeName, `%${search}%`));

    const results = await db
      .select({
        id: locations.id,
        storeName: locations.storeName,
        addressLine1: locations.addressLine1,
        addressLine2: locations.addressLine2,
        slug: locations.slug,
        currency: locations.currency,
        country: { id: countries.id, name: countries.name, code: countries.code },
        state: { id: states.id, name: states.name, code: states.code },
        city: { id: cities.id, name: cities.name },
        postalCode: { id: postalCodes.id, code: postalCodes.code },
      })
      .from(locations)
      .innerJoin(countries, eq(locations.countryId, countries.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
      .where(and(...conditions))
      .limit(50);

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
