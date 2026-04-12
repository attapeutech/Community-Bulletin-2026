import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, locations, users, payments } from "@/lib/db/schema";
import { requireApproverOrAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { sendAdDeniedEmail } from "@/lib/email/templates";
import { pushDashboardUpdate } from "@/lib/socket/notify";
import Stripe from "stripe";

const denySchema = z.object({
  reviewNote: z.string().min(10).max(500),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

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

    // Attempt Stripe refund if payment exists
    if (row.ad.paymentStatus === "paid") {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.adId, id))
        .limit(1);

      if (payment?.provider === "stripe" && payment.providerTxId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: payment.providerTxId,
          });
          await db
            .update(payments)
            .set({
              status: "refunded",
              providerRefundId: refund.id,
              refundedAt: now,
              updatedAt: now,
            })
            .where(eq(payments.id, payment.id));
          await db
            .update(ads)
            .set({ paymentStatus: "refunded", updatedAt: now })
            .where(eq(ads.id, id));
        } catch (err) {
          console.error("[Stripe refund error]", err);
          // Mark as refund_pending so admin can retry
          await db
            .update(ads)
            .set({ paymentStatus: "refund_pending", updatedAt: now })
            .where(eq(ads.id, id));
        }
      }

      // PayPal refunds require capturing then voiding — mark for manual handling
      if (payment?.provider === "paypal") {
        await db
          .update(ads)
          .set({ paymentStatus: "refund_pending", updatedAt: now })
          .where(eq(ads.id, id));
      }
    }

    // Send denial email (non-blocking)
    sendAdDeniedEmail({
      to: row.user.email,
      userName: row.user.name,
      adTitle: row.ad.title,
      reviewNote,
      adId: id,
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
