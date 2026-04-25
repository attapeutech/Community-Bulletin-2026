import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, users, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq, desc, and } from "drizzle-orm";
import { addDays } from "date-fns";
import { AD_DURATION_DAYS } from "@/types";
import { pushDisplayRefresh, pushDashboardUpdate } from "@/lib/socket/notify";
import { sendAdApprovedEmail, sendAdDeniedEmail } from "@/lib/email/templates";

// GET /api/admin/ads — all ads with optional status filter
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as typeof ads.$inferSelect["status"] | null;
    const paymentStatus = searchParams.get("paymentStatus") as typeof ads.$inferSelect["paymentStatus"] | null;

    const conditions = [];
    if (status) conditions.push(eq(ads.status, status));
    if (paymentStatus) conditions.push(eq(ads.paymentStatus, paymentStatus));

    const rows = await db
      .select({
        id: ads.id,
        title: ads.title,
        imageUrl: ads.imageUrl,
        status: ads.status,
        paymentStatus: ads.paymentStatus,
        reviewNote: ads.reviewNote,
        startedAt: ads.startedAt,
        endedAt: ads.endedAt,
        createdAt: ads.createdAt,
        user: { id: users.id, name: users.name, email: users.email },
        location: { id: locations.id, storeName: locations.storeName, slug: locations.slug },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(ads.createdAt))
      .limit(200);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("[GET /api/admin/ads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/ads — bulk status override
const overrideSchema = z.object({
  adId: z.string().uuid(),
  status: z.enum(["pending", "approved", "denied", "expired", "cancelled"]),
  reviewNote: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { adId, status, reviewNote } = overrideSchema.parse(body);

    // Fetch ad + location + user before updating (needed for emails + socket)
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
      .where(eq(ads.id, adId))
      .limit(1);

    if (!row) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });

    const now = new Date();
    const isApproving = status === "approved";
    const endedAt = isApproving ? addDays(now, AD_DURATION_DAYS) : row.ad.endedAt;

    const [updated] = await db
      .update(ads)
      .set({
        status,
        reviewNote: reviewNote || null,
        updatedAt: now,
        ...(isApproving && { startedAt: now, endedAt }),
      })
      .where(eq(ads.id, adId))
      .returning();

    // Push real-time updates
    pushDisplayRefresh(row.location.slug).catch(console.error);
    pushDashboardUpdate({ adId, status, locationSlug: row.location.slug }).catch(console.error);

    // Send emails (non-blocking)
    const { storeName, addressLine1, cityName, stateCode, postalCode } = row.location;
    const locationName = `${storeName} — ${addressLine1}, ${cityName}, ${stateCode} ${postalCode}`;
    if (isApproving) {
      sendAdApprovedEmail({
        to: row.user.email,
        userName: row.user.name,
        adTitle: row.ad.title,
        locationName,
        locationSlug: row.location.slug,
        adId,
        startedAt: now.toLocaleDateString("en-US", { dateStyle: "long" }),
        endedAt: endedAt.toLocaleDateString("en-US", { dateStyle: "long" }),
      }).catch(console.error);
    } else if (status === "denied" && reviewNote) {
      sendAdDeniedEmail({
        to: row.user.email,
        userName: row.user.name,
        adTitle: row.ad.title,
        reviewNote,
        adId,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    console.error("[PATCH /api/admin/ads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
