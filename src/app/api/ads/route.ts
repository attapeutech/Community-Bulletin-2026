import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { AD_DURATION_DAYS } from "@/types";
import { addDays } from "date-fns";
import { pushDashboardUpdate } from "@/lib/socket/notify";

const createAdSchema = z.object({
  locationId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  imageKey: z.string().min(1),
});

// POST /api/ads — create a new ad (status=pending, paymentStatus=unpaid)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const data = createAdSchema.parse(body);

    // Verify location exists and is active
    const [location] = await db
      .select({ id: locations.id, slug: locations.slug })
      .from(locations)
      .where(and(eq(locations.id, data.locationId), eq(locations.isActive, true)))
      .limit(1);

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Location not found or inactive" },
        { status: 404 }
      );
    }

    const now = new Date();
    const [ad] = await db
      .insert(ads)
      .values({
        userId,
        locationId: data.locationId,
        title: data.title,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        imageKey: data.imageKey,
        status: "pending",
        paymentStatus: "unpaid",
        startedAt: now,
        endedAt: addDays(now, AD_DURATION_DAYS),
        displayOrder: 0,
      })
      .returning();

    // Notify dashboard so admin sees new submission instantly (when socket is up)
    pushDashboardUpdate({ adId: ad.id, status: "pending", locationSlug: location.slug }).catch(console.error);

    return NextResponse.json({ success: true, data: ad }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[POST /api/ads]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
