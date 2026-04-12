import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations, users, payments } from "@/lib/db/schema";
import { requireApproverOrAdmin } from "@/lib/auth/session";
import { eq, and, desc } from "drizzle-orm";

// GET /api/ads/pending — paid ads awaiting review (approver/admin only)
export async function GET() {
  try {
    await requireApproverOrAdmin();

    const rows = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        imageUrl: ads.imageUrl,
        status: ads.status,
        paymentStatus: ads.paymentStatus,
        createdAt: ads.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        location: {
          id: locations.id,
          storeName: locations.storeName,
          slug: locations.slug,
          addressLine1: locations.addressLine1,
        },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(
        and(
          eq(ads.status, "pending"),
          eq(ads.paymentStatus, "paid")
        )
      )
      .orderBy(desc(ads.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("[GET /api/ads/pending]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
