import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { createPayPalOrder } from "@/lib/paypal";
import { paypalEnabled } from "@/lib/payment-options";

const schema = z.object({ adId: z.string().uuid() });

// POST /api/payments/paypal/create-order
export async function POST(req: NextRequest) {
  try {
    if (!paypalEnabled()) {
      return NextResponse.json({ success: false, error: "PayPal isn't available right now. Please pay by card." }, { status: 404 });
    }
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const { adId } = schema.parse(body);

    const [row] = await db
      .select({
        ad: ads,
        location: { storeName: locations.storeName, pricePerMonthCents: locations.pricePerMonthCents },
      })
      .from(ads)
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(and(eq(ads.id, adId), eq(ads.userId, userId)))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 }
      );
    }

    if (row.ad.paymentStatus !== "unpaid") {
      return NextResponse.json(
        { success: false, error: "Ad is already paid" },
        { status: 409 }
      );
    }

    const order = await createPayPalOrder(
      row.location.pricePerMonthCents,
      `Community Bulletin Ad — ${row.ad.title} @ ${row.location.storeName}`
    );

    return NextResponse.json({ success: true, data: { orderId: order.id } });
  } catch (error: any) {
    console.error("[POST /api/payments/paypal/create-order]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
