import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { stripe, stripeConnectEnabled } from "@/lib/stripe";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// POST /api/stripe/connect/onboard — store owner: open (or resume) Stripe's direct-deposit signup.
// Creates the owner's Express account the first time; Stripe collects identity, bank and W-9 details.
export async function POST() {
  try {
    if (!stripeConnectEnabled()) {
      return NextResponse.json({ success: false, error: "Direct deposit isn't available yet." }, { status: 404 });
    }
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "store_owner") {
      return NextResponse.json({ success: false, error: "Only store owners can set up direct deposit." }, { status: 403 });
    }
    const userId = (session.user as any).id as string;

    const [me] = await db
      .select({ email: users.email, name: users.name, stripeAccountId: users.stripeAccountId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!me) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    let accountId = me.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: me.email,
        capabilities: { transfers: { requested: true } },
        business_profile: { product_description: "Hosts a CommunityBulletin in-store ad screen" },
        metadata: { userId },
      }, {
        // Dedupes double-clicks; scoped to the minute so a failed attempt (which Stripe replays
        // for the same key) doesn't block the owner from trying again later
        idempotencyKey: `connect_account_${userId}_${Math.floor(Date.now() / 60_000)}`,
      });
      accountId = account.id;
      await db.update(users).set({ stripeAccountId: accountId, updatedAt: new Date() }).where(eq(users.id, userId));
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${APP_URL}/dashboard/store-owner/earnings?stripe=refresh`,
      return_url: `${APP_URL}/dashboard/store-owner/earnings?stripe=return`,
    });
    return NextResponse.json({ success: true, data: { url: link.url } });
  } catch (error: any) {
    console.error("[POST /api/stripe/connect/onboard]", error);
    return NextResponse.json({ success: false, error: error?.message ?? "Could not start setup" }, { status: 500 });
  }
}
