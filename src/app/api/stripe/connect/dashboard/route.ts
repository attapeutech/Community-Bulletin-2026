import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { stripe, stripeConnectEnabled } from "@/lib/stripe";

// POST /api/stripe/connect/dashboard — store owner: one-time link to their Stripe Express dashboard
// (payout history, bank account, tax forms)
export async function POST() {
  try {
    if (!stripeConnectEnabled()) {
      return NextResponse.json({ success: false, error: "Direct deposit isn't available yet." }, { status: 404 });
    }
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;

    const [me] = await db
      .select({ stripeAccountId: users.stripeAccountId, submitted: users.stripeDetailsSubmitted })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!me?.stripeAccountId || !me.submitted) {
      return NextResponse.json({ success: false, error: "Finish direct deposit setup first." }, { status: 409 });
    }

    const link = await stripe.accounts.createLoginLink(me.stripeAccountId);
    return NextResponse.json({ success: true, data: { url: link.url } });
  } catch (error: any) {
    console.error("[POST /api/stripe/connect/dashboard]", error);
    return NextResponse.json({ success: false, error: "Could not open Stripe" }, { status: 500 });
  }
}
