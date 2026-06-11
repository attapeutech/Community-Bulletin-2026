import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, and, lte, gte, asc, or, ilike, sql } from "drizzle-orm";

// GET /api/ads/live — public: all currently running ads, searchable
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const now = new Date();

    const baseWhere = and(
      eq(ads.status, "approved"),
      eq(ads.paymentStatus, "paid"),
      lte(ads.startedAt, now),
      gte(ads.endedAt, now),
      eq(locations.isActive, true)
    );

    const searchWhere = search
      ? or(
          ilike(locations.storeName, `%${search}%`),
          ilike(locations.addressLine1, `%${search}%`),
          ilike(sql`coalesce(${locations.storeNumber}, '')`, `%${search}%`),
          ilike(cities.name, `%${search}%`),
          ilike(ads.title, `%${search}%`),
          ilike(sql`coalesce(${ads.description}, '')`, `%${search}%`),
          ilike(ads.id, `%${search}%`)
        )
      : undefined;

    const rows = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        imageUrl: ads.imageUrl,
        displayOrder: ads.displayOrder,
        contactPhone:   ads.contactPhone,
        contactAddress: ads.contactAddress,
        contactWebsite: ads.contactWebsite,
        showPhone:   ads.showPhone,
        showAddress: ads.showAddress,
        showWebsite: ads.showWebsite,
        startedAt: ads.startedAt,
        endedAt: ads.endedAt,
        locationSlug:    locations.slug,
        locationName:    locations.displayName,
        storeName:       locations.storeName,
        storeNumber:     locations.storeNumber,
        addressLine1:    locations.addressLine1,
        cityName:        cities.name,
        stateCode:       states.code,
        postalCode:      postalCodes.code,
      })
      .from(ads)
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
      .where(searchWhere ? and(baseWhere, searchWhere) : baseWhere)
      .orderBy(asc(ads.displayOrder), asc(ads.startedAt))
      .limit(100);

    const data = rows.map((r) => ({
      ...r,
      locationName: r.locationName || r.storeName,
      startedAt: r.startedAt.toISOString(),
      endedAt: r.endedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/ads/live]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
