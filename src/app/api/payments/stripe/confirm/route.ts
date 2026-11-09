import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe";
import { recordPaidCheckout } from "@/lib/stripe-checkout";

export const dynamic = "force-dynamic";

// POST /api/payments/stripe/confirm
// Called from the success page as a fallback in case the webhook was delayed.
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const { sessionId, adId } = await req.json();
    if (!sessionId || !adId) {
      return NextResponse.json({ success: false, error: "Missing params" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await recordPaidCheckout(checkoutSession, adId, userId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

    return NextResponse.json(result.alreadyPaid ? { success: true, alreadyPaid: true } : { success: true });
  } catch (error: any) {
    console.error("[POST /api/payments/stripe/confirm]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
