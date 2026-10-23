import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { AD_DURATION_DAYS } from "@/types";

// PATCH /api/ads/[id]/renew — resubmit an expired or cancelled ad for a new run
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    const { id } = await params;

    const [ad] = await db.select({ userId: ads.userId, status: ads.status })
      .from(ads).where(eq(ads.id, id)).limit(1);

    if (!ad) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    if (ad.userId !== userId && role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (ad.status !== "expired" && ad.status !== "cancelled") {
      return NextResponse.json({ success: false, error: "Only expired or cancelled ads can be renewed" }, { status: 400 });
    }

    const now = new Date();
    await db.update(ads)
      .set({
        status: "pending",
        paymentStatus: "unpaid",
        startedAt: now,
        endedAt: addDays(now, AD_DURATION_DAYS),
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: now,
      })
      .where(eq(ads.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/ads/[id]/renew]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
