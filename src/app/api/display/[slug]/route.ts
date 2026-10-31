import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, demos, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, and, or, lte, gte, gt, asc, min, isNull } from "drizzle-orm";
import { getAdvertiseSlideSettings, getDisplayDesign } from "@/lib/settings";

// One value per running server process (shared across route bundles)
const SERVER_VERSION: string = ((globalThis as any).__cbServerVersion ??= String(Date.now()));

// Reserved slug: one screen with every live ad from all active locations (used by Live Ads)
const ALL_LOCATIONS_SLUG = "all";

const adColumns = {
  id: ads.id,
  title: ads.title,
  description: ads.description,
  imageUrl: ads.imageUrl,
  displayOrder: ads.displayOrder,
  startedAt: ads.startedAt,
  endedAt: ads.endedAt,
  contactPhone:   ads.contactPhone,
  contactAddress: ads.contactAddress,
  contactWebsite: ads.contactWebsite,
  showPhone:   ads.showPhone,
  showAddress: ads.showAddress,
  showWebsite: ads.showWebsite,
  isTest: ads.isTest,
  template: ads.template,
  templateData: ads.templateData,
};

// Paid ads; display previews (?preview=) also get admin test ads. A sales demo link (?demo=) shows only
// that demo's ads, the one advertiser being pitched. Demo ads never show on previews.
const shownAds = (preview: boolean, demoId?: string | null) => demoId
  ? eq(ads.demoId, demoId)
  : or(eq(ads.paymentStatus, "paid"), preview ? and(eq(ads.isTest, true), isNull(ads.demoId)) : undefined);

async function allLocationsResponse(now: Date, preview: boolean) {
  const liveAds = await db
    .select(adColumns)
    .from(ads)
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .where(and(
      eq(locations.isActive, true),
      eq(ads.status, "approved"),
      shownAds(preview),
      lte(ads.startedAt, now),
      gte(ads.endedAt, now)
    ))
    .orderBy(asc(ads.startedAt));
  const [{ fromPriceCents }] = await db
    .select({ fromPriceCents: min(locations.pricePerRunCents) })
    .from(locations)
    .where(eq(locations.isActive, true));

  return NextResponse.json({
    success: true,
    data: {
      location: {
        slug: ALL_LOCATIONS_SLUG,
        name: "All locations",
        storeName: "Community Bulletin",
        storeNumber: null,
        pricePerRunCents: fromPriceCents ?? undefined,
        allLocations: true,
        address: "", address2: null, city: "", stateCode: "", postalCode: "",
      },
      ads: liveAds,
      advertiseSlide: await getAdvertiseSlideSettings(),
      design: await getDisplayDesign(),
      version: SERVER_VERSION,
    },
  });
}

// GET /api/display/[slug] — public: approved, currently-running ads for a location
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const now = new Date();
    const preview = req.nextUrl.searchParams.has("preview");
    const demoToken = req.nextUrl.searchParams.get("demo");
    if (slug === ALL_LOCATIONS_SLUG) return await allLocationsResponse(now, preview);

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
        pricePerRunCents: locations.pricePerRunCents,
        dailyCustomers: locations.dailyCustomers,
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

    // Sales demo link: only while it hasn't expired, and only on its own store's screen
    let demoId: string | null = null;
    if (demoToken) {
      const [demo] = await db.select({ id: demos.id }).from(demos)
        .where(and(eq(demos.token, demoToken), eq(demos.locationId, location.id), gt(demos.expiresAt, now)))
        .limit(1);
      if (!demo) return NextResponse.json({ success: false, error: "This demo link has expired or was removed" }, { status: 404 });
      demoId = demo.id;
    }

    const activeAds = await db
      .select(adColumns)
      .from(ads)
      .where(
        and(
          eq(ads.locationId, location.id),
          eq(ads.status, "approved"),
          shownAds(preview, demoId),
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
          pricePerRunCents: location.pricePerRunCents,
          dailyCustomers: location.dailyCustomers,
          address: location.addressLine1,
          address2: location.addressLine2,
          city: location.cityName,
          stateCode: location.stateCode,
          postalCode: location.postalCode,
        },
        ads: activeAds,
        // A demo shows the advertiser's ads only, without the "Advertise here" slide
        advertiseSlide: demoId ? null : await getAdvertiseSlideSettings(),
        design: await getDisplayDesign(),
        // Changes on every deploy/restart; screens reload themselves when it changes
        version: SERVER_VERSION,
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
