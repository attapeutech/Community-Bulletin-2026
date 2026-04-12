import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations, payments } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";

// GET /api/ads/mine — current user's ads with location + payment info
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const rows = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        imageUrl: ads.imageUrl,
        status: ads.status,
        paymentStatus: ads.paymentStatus,
        reviewNote: ads.reviewNote,
        startedAt: ads.startedAt,
        endedAt: ads.endedAt,
        createdAt: ads.createdAt,
        location: {
          id: locations.id,
          storeName: locations.storeName,
          slug: locations.slug,
        },
      })
      .from(ads)
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(eq(ads.userId, userId))
      .orderBy(desc(ads.createdAt));

    // Get payment amounts per ad
    const adIds = rows.map((r) => r.id);
    let paymentMap: Record<string, number> = {};
    if (adIds.length > 0) {
      const paymentRows = await db
        .select({ adId: payments.adId, amountCents: payments.amountCents })
        .from(payments)
        .where(eq(payments.userId, userId));
      for (const p of paymentRows) {
        paymentMap[p.adId] = p.amountCents;
      }
    }

    const data = rows.map((r) => ({
      ...r,
      amountCents: paymentMap[r.id] ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[GET /api/ads/mine]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
