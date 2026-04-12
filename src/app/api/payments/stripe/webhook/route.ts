import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { ads, payments, users, locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendAdSubmittedEmail } from "@/lib/email/templates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// POST /api/payments/stripe/webhook
// Disable body parsing — we need raw bytes for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const rawBody = await req.arrayBuffer();
  const buf = Buffer.from(rawBody);
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const adId = session.metadata?.adId;
    const userId = session.metadata?.userId;

    if (!adId || !userId) {
      return NextResponse.json({ received: true });
    }

    const now = new Date();

    // Record payment
    await db.insert(payments).values({
      adId,
      userId,
      provider: "stripe",
      providerTxId: session.payment_intent as string,
      status: session.payment_status ?? "paid",
      amountCents: session.amount_total ?? 10000,
      currency: (session.currency ?? "usd").toUpperCase(),
    });

    // Mark ad as paid
    await db
      .update(ads)
      .set({ paymentStatus: "paid", updatedAt: now })
      .where(eq(ads.id, adId));

    // Fetch ad details for submission email
    const [row] = await db
      .select({
        ad: ads,
        user: { id: users.id, name: users.name, email: users.email },
        location: { storeName: locations.storeName },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(eq(ads.id, adId))
      .limit(1);

    if (row) {
      sendAdSubmittedEmail({
        to: row.user.email,
        userName: row.user.name,
        adTitle: row.ad.title,
        locationName: row.location.storeName,
        adId,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
