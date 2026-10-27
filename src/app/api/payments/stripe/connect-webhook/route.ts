import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { syncConnectAccount } from "@/lib/direct-deposits";

export const dynamic = "force-dynamic";

// POST /api/payments/stripe/connect-webhook — Stripe Connect events (store owners' Express accounts).
// account.updated keeps each owner's direct-deposit status current.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Stripe connect webhook] STRIPE_CONNECT_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, req.headers.get("stripe-signature") ?? "", secret);
  } catch (err: any) {
    console.error("[Stripe connect webhook] bad signature:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "account.updated") {
      await syncConnectAccount((event.data.object as Stripe.Account).id);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe connect webhook] handler failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
