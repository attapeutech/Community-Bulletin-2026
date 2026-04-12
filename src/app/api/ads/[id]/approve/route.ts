import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations, users } from "@/lib/db/schema";
import { requireApproverOrAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { AD_DURATION_DAYS } from "@/types";
import { sendAdApprovedEmail } from "@/lib/email/templates";
import { pushDisplayRefresh, pushDashboardUpdate } from "@/lib/socket/notify";

// PATCH /api/ads/[id]/approve
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApproverOrAdmin();
    const reviewerId = (session.user as any).id as string;
    const { id } = await params;

    // Load ad with user + location
    const [row] = await db
      .select({
        ad: ads,
        user: { id: users.id, name: users.name, email: users.email },
        location: {
          id: locations.id,
          storeName: locations.storeName,
          slug: locations.slug,
        },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(eq(ads.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 }
      );
    }

    if (row.ad.status !== "pending" || row.ad.paymentStatus !== "paid") {
      return NextResponse.json(
        { success: false, error: "Ad cannot be approved in its current state" },
        { status: 409 }
      );
    }

    const now = new Date();
    const endedAt = addDays(now, AD_DURATION_DAYS);

    const [updated] = await db
      .update(ads)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: now,
        startedAt: now,
        endedAt,
        updatedAt: now,
      })
      .where(eq(ads.id, id))
      .returning();

    // Send approval email (non-blocking)
    sendAdApprovedEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      locationName: row.location.storeName,
      locationSlug: row.location.slug,
      adId: id,
      startedAt: now.toLocaleDateString("en-US", { dateStyle: "long" }),
      endedAt: endedAt.toLocaleDateString("en-US", { dateStyle: "long" }),
    }).catch(console.error);

    // Notify display screen + dashboard (non-blocking)
    pushDisplayRefresh(row.location.slug).catch(console.error);
    pushDashboardUpdate({
      adId: id,
      status: "approved",
      locationSlug: row.location.slug,
    }).catch(console.error);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[PATCH /api/ads/[id]/approve]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
