import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, and, or, lte, gte, asc } from "drizzle-orm";

// GET /api/display/[slug] — public: approved, currently-running ads for a location
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const now = new Date();

    // Accept both slug ("store-name-abc123") and raw UUID (for direct TV links)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const locationWhere = and(
      isUuid
        ? or(eq(locations.slug, slug), eq(locations.id, slug))
        : eq(locations.slug, slug),
      eq(locations.isActive, true)
    );

    const [location] = await db
      .select({
        id: locations.id,
        slug: locations.slug,
        storeName: locations.storeName,
        storeNumber: locations.storeNumber,
        displayName: locations.displayName,
        addressLine1: locations.addressLine1,
        addressLine2: locations.addressLine2,
        cityName: cities.name,
        stateCode: states.code,
        postalCode: postalCodes.code,
      })
      .from(locations)
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
      .where(locationWhere)
      .limit(1);

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Location not found" },
        { status: 404 }
      );
    }

    const activeAds = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        imageUrl: ads.imageUrl,
        displayOrder: ads.displayOrder,
        startedAt: ads.startedAt,
        endedAt: ads.endedAt,
      })
      .from(ads)
      .where(
        and(
          eq(ads.locationId, location.id),
          eq(ads.status, "approved"),
          eq(ads.paymentStatus, "paid"),
          lte(ads.startedAt, now),
          gte(ads.endedAt, now)
        )
      )
      .orderBy(asc(ads.displayOrder), asc(ads.startedAt));

    return NextResponse.json({
      success: true,
      data: {
        location: {
          slug: location.slug,
          name: location.displayName || location.storeName,
          storeName: location.storeName,
          storeNumber: location.storeNumber ?? null,
          address: location.addressLine1,
          address2: location.addressLine2,
          city: location.cityName,
          stateCode: location.stateCode,
          postalCode: location.postalCode,
        },
        ads: activeAds,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/display/[slug]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
