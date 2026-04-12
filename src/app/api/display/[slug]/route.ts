import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { eq, and, lte, gte, asc } from "drizzle-orm";

// GET /api/display/[slug] — public: approved, currently-running ads for a location
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const now = new Date();

    const [location] = await db
      .select({ id: locations.id, slug: locations.slug, storeName: locations.storeName, displayName: locations.displayName })
      .from(locations)
      .where(and(eq(locations.slug, slug), eq(locations.isActive, true)))
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
