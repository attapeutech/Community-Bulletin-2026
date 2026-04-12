import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, locations, users, payments } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// GET /api/ads/[id] — get a single ad (owner or approver/admin)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    const { id } = await params;

    const [row] = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        imageUrl: ads.imageUrl,
        imageKey: ads.imageKey,
        status: ads.status,
        paymentStatus: ads.paymentStatus,
        reviewNote: ads.reviewNote,
        startedAt: ads.startedAt,
        endedAt: ads.endedAt,
        displayOrder: ads.displayOrder,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
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
      .where(eq(ads.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 }
      );
    }

    // Non-approvers can only see their own ads
    if (
      role !== "approver" &&
      role !== "admin" &&
      row.user.id !== userId
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch payments for this ad
    const adPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.adId, id));

    return NextResponse.json({ success: true, data: { ...row, payments: adPayments } });
  } catch (error: any) {
    console.error("[GET /api/ads/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
