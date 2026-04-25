import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, locations, users } from "@/lib/db/schema";
import { requireApproverOrAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { sendAdDeniedEmail } from "@/lib/email/templates";
import { pushDashboardUpdate } from "@/lib/socket/notify";
import { processAdRefund } from "@/lib/refund";

const denySchema = z.object({
  reviewNote: z.string().min(10).max(500),
});

// PATCH /api/ads/[id]/deny
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApproverOrAdmin();
    const reviewerId = (session.user as any).id as string;
    const { id } = await params;

    const body = await req.json();
    const { reviewNote } = denySchema.parse(body);

    // Load ad with user + location + payments
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

    if (row.ad.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Ad is not in pending state" },
        { status: 409 }
      );
    }

    const now = new Date();

    const [updated] = await db
      .update(ads)
      .set({
        status: "denied",
        reviewNote,
        reviewedBy: reviewerId,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(ads.id, id))
      .returning();

    // Process refund if ad was paid
    let refundResult: { status: "refunded" | "refund_pending" | "no_payment"; amountCents: number } = { status: "no_payment", amountCents: 0 };
    if (row.ad.paymentStatus === "paid") {
      const result = await processAdRefund(id);
      refundResult = { status: result.status as typeof refundResult.status, amountCents: result.amountCents };
    }

    // Send denial + refund email (non-blocking)
    const amountFormatted = `$${(refundResult.amountCents / 100).toFixed(2)}`;
    sendAdDeniedEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      reviewNote,
      adId: id,
      amountFormatted,
      refundStatus: (refundResult.status === "refunded" ? "refunded" : "refund_pending") as "refunded" | "refund_pending",
    }).catch(console.error);

    // Notify dashboard (non-blocking)
    pushDashboardUpdate({
      adId: id,
      status: "denied",
      locationSlug: row.location.slug,
    }).catch(console.error);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[PATCH /api/ads/[id]/deny]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
