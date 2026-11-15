import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { recordPaidCheckout } from "@/lib/stripe-checkout";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// POST /api/payments/stripe/webhook
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[Stripe webhook] failed to read body:", err);
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[Stripe webhook] received event:", event.type);

  // Cards are paid when checkout completes. Delayed methods (bank payments via Link) complete
  // with payment_status "unpaid" and are recorded only when async_payment_succeeded arrives.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const adId = session.metadata?.adId;
    const userId = session.metadata?.userId;

    if (!adId || !userId) {
      return NextResponse.json({ received: true });
    }
    if (session.payment_status !== "paid") {
      console.log(`[Stripe webhook] checkout ${session.id} completed but not paid yet (${session.payment_status}); waiting for async_payment_succeeded`);
      return NextResponse.json({ received: true });
    }

    // Same recording as the success page (single ad, or one payment row per store for a multi-store order);
    // safe if both run, since the payment intent is recorded once
    const result = await recordPaidCheckout(session, adId, userId);
    if (!result.ok) console.error(`[Stripe webhook] checkout ${session.id} not recorded: ${result.error}`);
  }

  return NextResponse.json({ received: true });
}
