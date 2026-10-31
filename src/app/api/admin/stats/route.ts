import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, users, locations, payments } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq, and, count, sum, gte, isNull } from "drizzle-orm";

// GET /api/admin/stats

// Sales demo ads are managed on their lead's page in Sales, not counted here
const notDemo = isNull(ads.demoId);

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalAds,
      pendingAds,
      approvedAds,
      deniedAds,
      totalUsers,
      totalLocations,
      revenue,
    ] = await Promise.all([
      db.select({ count: count() }).from(ads).where(notDemo),
      db.select({ count: count() }).from(ads).where(eq(ads.status, "pending")),
      db.select({ count: count() }).from(ads).where(and(eq(ads.status, "approved"), eq(ads.isTest, false))),
      db.select({ count: count() }).from(ads).where(and(eq(ads.status, "denied"), notDemo)),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(locations),
      db.select({ total: sum(payments.amountCents) }).from(payments).where(eq(payments.status, "paid")),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalAds: totalAds[0].count,
        pendingAds: pendingAds[0].count,
        approvedAds: approvedAds[0].count,
        deniedAds: deniedAds[0].count,
        totalUsers: totalUsers[0].count,
        totalLocations: totalLocations[0].count,
        totalRevenueCents: Number(revenue[0].total ?? 0),
      },
    });
  } catch (error: any) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
