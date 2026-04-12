import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, users, locations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq, desc, and } from "drizzle-orm";

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

    const now = new Date();
    const [updated] = await db
      .update(ads)
      .set({ status, reviewNote: reviewNote ?? null, updatedAt: now })
      .where(eq(ads.id, adId))
      .returning();

    if (!updated) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    console.error("[PATCH /api/admin/ads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
