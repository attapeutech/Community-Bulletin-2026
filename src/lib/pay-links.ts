import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, cities, locations, states, users } from "@/lib/db/schema";

// Pay links: the sales team texts or emails an advertiser a link to pay for their own unpaid ad,
// with no sign-in. The link is signed, not stored: <ad id>.<expiry, unix seconds>.<signature>.
// It only lets someone pay for that one ad, and stops working once the ad isn't waiting for payment.

export const PAY_LINK_DAYS = 30;

const sign = (adId: string, exp: number) =>
  createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(`pay-link:${adId}.${exp}`).digest("base64url").slice(0, 32);

export const payLinkPath = (token: string) => `/pay/${token}`;

/** A new pay link token for an ad, good for PAY_LINK_DAYS */
export function newPayLinkToken(adId: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + PAY_LINK_DAYS * 24 * 60 * 60;
  return `${adId}.${exp}.${sign(adId, exp)}`;
}

/** The ad id in a pay link token, or why it doesn't work */
export function readPayLinkToken(token: string, now = Date.now()): { adId: string } | { error: "invalid" | "expired" } {
  const m = /^([0-9a-f-]{36})\.(\d{9,11})\.([A-Za-z0-9_-]{32})$/.exec(token);
  if (!m) return { error: "invalid" };
  const [, adId, expStr, sig] = m;
  const exp = Number(expStr);
  const expected = Buffer.from(sign(adId, exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { error: "invalid" };
  if (exp * 1000 < now) return { error: "expired" };
  return { adId };
}

/** The ad behind a pay link, with what the pay page needs (null when the ad is gone or is a demo ad) */
export async function loadPayLinkAd(adId: string) {
  const [row] = await db
    .select({
      id: ads.id,
      title: ads.title,
      imageUrl: ads.imageUrl,
      status: ads.status,
      paymentStatus: ads.paymentStatus,
      userId: ads.userId,
      userEmail: users.email,
      userName: users.name,
      storeName: locations.storeName,
      storeSlug: locations.slug,
      storeAddress: locations.addressLine1,
      storeActive: locations.isActive,
      price: locations.pricePerRunCents,
      shoppers: locations.dailyCustomers,
      city: cities.name,
      state: states.code,
    })
    .from(ads)
    .innerJoin(users, eq(ads.userId, users.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .where(and(eq(ads.id, adId), isNull(ads.demoId)))
    .limit(1);
  return row ?? null;
}

export type PayLinkAd = NonNullable<Awaited<ReturnType<typeof loadPayLinkAd>>>;

/** Why this ad can't be paid now, or null when it can */
export function payLinkBlocked(ad: PayLinkAd) {
  if (ad.paymentStatus === "paid") return "This ad has already been paid. Thank you!";
  if (ad.paymentStatus !== "unpaid" || ad.status !== "pending") return "This ad isn't waiting for payment anymore. Reply to the message and we'll help.";
  if (!ad.storeActive) return "This screen isn't taking new ads right now. Reply to the message and we'll help.";
  return null;
}
