import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { AD_PRICE_CENTS } from "@/types";

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
        location: { storeName: locations.storeName, slug: locations.slug },
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

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: AD_PRICE_CENTS,
            product_data: {
              name: `Community Bulletin Ad — ${row.ad.title}`,
              description: `30-day display at ${row.location.storeName}`,
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
