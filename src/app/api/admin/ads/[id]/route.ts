import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, users, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { AD_DURATION_DAYS } from "@/types";
import { sendAdApprovedEmail, sendAdDeniedEmail, sendAdCancelledEmail } from "@/lib/email/templates";
import { pushDisplayRefresh, pushDashboardUpdate } from "@/lib/socket/notify";
import { processAdRefund } from "@/lib/refund";

const editSchema = z.object({
  title:          z.string().min(1).max(200).optional(),
  description:    z.string().max(1000).nullable().optional(),
  status:         z.enum(["pending", "approved", "denied", "expired", "cancelled"]).optional(),
  paymentStatus:  z.enum(["unpaid", "paid", "refunded", "refund_pending", "failed"]).optional(),
  startedAt:      z.string().datetime().optional(),
  endedAt:        z.string().datetime().optional(),
  imageUrl:       z.string().url().optional(),
  displayOrder:   z.number().int().min(0).optional(),
  contactPhone:   z.string().max(50).nullable().optional(),
  contactAddress: z.string().max(300).nullable().optional(),
  contactWebsite: z.string().max(500).nullable().optional(),
  showPhone:      z.boolean().optional(),
  showAddress:    z.boolean().optional(),
  showWebsite:    z.boolean().optional(),
  reviewNote:     z.string().max(500).nullable().optional(),
});

// PATCH /api/admin/ads/[id] — admin direct edit (sends emails on status transitions)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const fields = editSchema.parse(body);

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 422 });
    }

    // Fetch current ad state + user + location for email / socket
    const [row] = await db
      .select({
        ad: ads,
        user: { id: users.id, name: users.name, email: users.email },
        location: {
          id: locations.id,
          storeName: locations.storeName,
          slug: locations.slug,
          addressLine1: locations.addressLine1,
          cityName: cities.name,
          stateCode: states.code,
          postalCode: postalCodes.code,
        },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
      .where(eq(ads.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    }

    const previousStatus = row.ad.status;
    const newStatus = fields.status;

    // When approving via edit, auto-set run dates if not explicitly provided
    const now = new Date();
    const isApproving = newStatus === "approved" && previousStatus !== "approved";
    const endedAt = fields.endedAt ? new Date(fields.endedAt) : (isApproving ? addDays(now, AD_DURATION_DAYS) : undefined);
    const startedAt = fields.startedAt ? new Date(fields.startedAt) : (isApproving ? now : undefined);

    const [updated] = await db
      .update(ads)
      .set({
        ...fields,
        startedAt,
        endedAt,
        updatedAt: now,
      })
      .where(eq(ads.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    }

    // Send emails and push socket on status transitions
    if (newStatus && newStatus !== previousStatus) {
      const { storeName, addressLine1, cityName, stateCode, postalCode } = row.location;
      const locationName = `${storeName} — ${addressLine1}, ${cityName}, ${stateCode} ${postalCode}`;

      if (isApproving) {
        sendAdApprovedEmail({
          to: row.user.email,
          userName: row.user.name,
          adTitle: row.ad.title,
          locationName,
          locationSlug: row.location.slug,
          adId: id,
          startedAt: now.toLocaleDateString("en-US", { dateStyle: "long" }),
          endedAt: endedAt!.toLocaleDateString("en-US", { dateStyle: "long" }),
        }).catch(console.error);

        pushDisplayRefresh(row.location.slug).catch(console.error);
      } else if (newStatus === "denied") {
        const reviewNote = fields.reviewNote || "Your ad did not meet our content guidelines.";
        let refundResult = { status: "no_payment" as const, amountCents: 0 };
        if (row.ad.paymentStatus === "paid") {
          const result = await processAdRefund(id);
          refundResult = { status: result.status as typeof refundResult.status, amountCents: result.amountCents };
        }
        sendAdDeniedEmail({
          to: row.user.email,
          userName: row.user.name,
          adTitle: row.ad.title,
          reviewNote,
          adId: id,
          amountFormatted: `$${(refundResult.amountCents / 100).toFixed(2)}`,
          refundStatus: refundResult.status === "refunded" ? "refunded" : "refund_pending",
        }).catch(console.error);
      } else if (newStatus === "cancelled") {
        const cancelNote = fields.reviewNote || "Your ad has been cancelled by our team.";
        let refundResult = { status: "no_payment" as const, amountCents: 0 };
        if (row.ad.paymentStatus === "paid") {
          const result = await processAdRefund(id);
          refundResult = { status: result.status as typeof refundResult.status, amountCents: result.amountCents };
        }
        sendAdCancelledEmail({
          to: row.user.email,
          userName: row.user.name,
          adTitle: row.ad.title,
          cancelNote,
          adId: id,
          amountFormatted: `$${(refundResult.amountCents / 100).toFixed(2)}`,
          refundStatus: refundResult.status,
        }).catch(console.error);
      }

      pushDashboardUpdate({ adId: id, status: newStatus, locationSlug: row.location.slug }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 422 });
    }
    console.error("[PATCH /api/admin/ads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
