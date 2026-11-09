import { NextRequest, NextResponse } from "next/server";
import { loadPayLinkAd, payLinkBlocked, payLinkPath, readPayLinkToken } from "@/lib/pay-links";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

// POST /api/pay/[token] — public, no sign-in: start Stripe Checkout for the ad behind a pay link.
// The payment is the ad owner's, as if they paid from My Ads; the ad then goes to review as usual.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const read = readPayLinkToken(token);
    if ("error" in read) {
      return NextResponse.json({ success: false, error: read.error === "expired" ? "This link has expired. Reply to the message and we'll send a new one." : "This link isn't valid." }, { status: 404 });
    }
    const ad = await loadPayLinkAd(read.adId);
    if (!ad) return NextResponse.json({ success: false, error: "This ad is no longer available." }, { status: 404 });
    const blocked = payLinkBlocked(ad);
    if (blocked) return NextResponse.json({ success: false, error: blocked }, { status: 409 });

    const back = `${SITE_URL}${payLinkPath(token)}`;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: ad.userEmail,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: ad.price,
          product_data: { name: `Community Bulletin Ad — ${ad.title}`, description: `4-week display at ${ad.storeName}` },
        },
        quantity: 1,
      }],
      metadata: { adId: ad.id, userId: ad.userId, locationSlug: ad.storeSlug },
      success_url: `${back}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
    });

    return NextResponse.json({ success: true, data: { url: checkout.url } });
  } catch (error) {
    console.error("[POST /api/pay/[token]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
