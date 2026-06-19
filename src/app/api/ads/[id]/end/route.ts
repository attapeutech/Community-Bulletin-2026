import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

// PATCH /api/ads/[id]/end — immediately end an approved ad
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    const { id } = await params;

    const [ad] = await db.select({ userId: ads.userId, status: ads.status, paymentStatus: ads.paymentStatus })
      .from(ads).where(eq(ads.id, id)).limit(1);

    if (!ad) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    if (ad.userId !== userId && role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (ad.status !== "approved") {
      return NextResponse.json({ success: false, error: "Only approved ads can be ended" }, { status: 400 });
    }

    // Unpaid+approved is an inconsistent test state — reset to pending instead of cancelling
    const newStatus = ad.paymentStatus !== "paid" ? "pending" : "cancelled";

    await db.update(ads)
      .set({ status: newStatus, endedAt: new Date(), updatedAt: new Date() })
      .where(eq(ads.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/ads/[id]/end]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
