import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

const schema = z.object({ adId: z.string().uuid() });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// POST /api/payments/stripe/create-checkout
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;
    const userEmail = (session.user as any).email as string;

    const body = await req.json();
    const { adId } = schema.parse(body);

    // Verify the ad belongs to this user and is unpaid
    const [row] = await db
      .select({
        ad: ads,
        location: { storeName: locations.storeName, slug: locations.slug, pricePerRunCents: locations.pricePerRunCents },
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

    // Multi-store order: one line per store still unpaid in the order (each line carries its ad id,
    // so the payment can be split per store when it's recorded)
    if (row.ad.orderId) {
      const orderAds = await db
        .select({ id: ads.id, title: ads.title, storeName: locations.storeName, price: locations.pricePerRunCents })
        .from(ads)
        .innerJoin(locations, eq(ads.locationId, locations.id))
        .where(and(eq(ads.orderId, row.ad.orderId), eq(ads.userId, userId), eq(ads.paymentStatus, "unpaid")));
      if (!orderAds.length) {
        return NextResponse.json({ success: false, error: "This order is already paid" }, { status: 409 });
      }
      const orderSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: userEmail,
        line_items: orderAds.map((a) => ({
          price_data: {
            currency: "usd",
            unit_amount: a.price,
            product_data: {
              name: `Community Bulletin Ad — ${a.title}`,
              description: `4-week display at ${a.storeName}`,
              metadata: { adId: a.id },
            },
          },
          quantity: 1,
        })),
        metadata: { adId, userId, orderId: row.ad.orderId },
        success_url: `${APP_URL}/ads/${adId}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/ads/${adId}/payment?cancelled=true`,
      });
      return NextResponse.json({ success: true, data: { url: orderSession.url } });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: row.location.pricePerRunCents,
            product_data: {
              name: `Community Bulletin Ad — ${row.ad.title}`,
              description: `4-week display at ${row.location.storeName}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        adId,
        userId,
        locationSlug: row.location.slug,
      },
      success_url: `${APP_URL}/ads/${adId}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/ads/${adId}/payment?cancelled=true`,
    });

    return NextResponse.json({
      success: true,
      data: { url: checkoutSession.url },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 422 }
      );
    }
    console.error("[POST /api/payments/stripe/create-checkout]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
