import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ads, adSwaps, locations, users, cities, states, postalCodes } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { and, eq } from "drizzle-orm";
import { canSwap, swapColumns, swapContentSchema } from "@/lib/ad-swaps";
import { notifyRoles } from "@/lib/notifications";
import { sendAdSwapReviewEmail } from "@/lib/email/templates";
import { formatLocationLabel } from "@/lib/location-label";

// The advertiser's own ad, with what the swap form and checks need
async function ownAd(id: string, userId: string) {
  const [row] = await db
    .select({
      ad: ads,
      location: {
        storeName: locations.storeName,
        storeNumber: locations.storeNumber,
        slug: locations.slug,
        addressLine1: locations.addressLine1,
        cityName: cities.name,
        stateCode: states.code,
        postalCode: postalCodes.code,
      },
      userName: users.name,
    })
    .from(ads)
    .innerJoin(users, eq(ads.userId, users.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(and(eq(ads.id, id), eq(ads.userId, userId)))
    .limit(1);
  return row ?? null;
}

const pendingSwap = (adId: string) =>
  db.select({ id: adSwaps.id, title: adSwaps.title, createdAt: adSwaps.createdAt }).from(adSwaps)
    .where(and(eq(adSwaps.adId, adId), eq(adSwaps.status, "pending"))).limit(1).then(r => r[0] ?? null);

// GET /api/ads/[id]/swap — the running ad's content, to fill in the swap form (owner only)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const row = await ownAd(id, (session.user as any).id);
    if (!row) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    const a = row.ad;
    return NextResponse.json({
      success: true,
      data: {
        id: a.id, title: a.title, description: a.description, imageUrl: a.imageUrl, imageKey: a.imageKey,
        contactPhone: a.contactPhone, contactAddress: a.contactAddress, contactWebsite: a.contactWebsite,
        showPhone: a.showPhone, showAddress: a.showAddress, showWebsite: a.showWebsite,
        template: a.template, templateData: a.templateData, endedAt: a.endedAt,
        locationSlug: row.location.slug,
        canSwap: canSwap(a),
        pending: await pendingSwap(a.id),
      },
    });
  } catch (error) {
    console.error("[GET /api/ads/[id]/swap]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/ads/[id]/swap — send a new version of a running paid ad for review (no payment)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;
    const { id } = await params;
    const row = await ownAd(id, userId);
    if (!row) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    if (!canSwap(row.ad)) {
      return NextResponse.json({ success: false, error: "Only a paid ad that's running can be swapped" }, { status: 409 });
    }
    if (await pendingSwap(id)) {
      return NextResponse.json({ success: false, error: "A new version of this ad is already waiting for review" }, { status: 409 });
    }

    const built = swapColumns(swapContentSchema.parse(await req.json()));
    if ("error" in built) return NextResponse.json({ success: false, error: built.error }, { status: 422 });

    const [swap] = await db.insert(adSwaps).values({ adId: id, userId, ...built.columns }).returning();

    await notifyRoles(["approver", "admin"], {
      type: "ad_pending_review",
      adId: id,
      subject: `Ad swap to review: "${swap.title}"`,
      body: `Replaces "${row.ad.title}" at ${row.location.storeName}. Already paid; the current ad keeps running until approved.`,
      link: "/dashboard/approver",
    });
    sendAdSwapReviewEmail({
      currentTitle: row.ad.title,
      newTitle: swap.title,
      locationName: formatLocationLabel(row.location),
      userName: row.userName,
    }).catch(console.error);

    return NextResponse.json({ success: true, data: swap }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 422 });
    }
    // Two submits at once: the one-pending-swap index refuses the second
    if (error.code === "23505" || error.cause?.code === "23505") {
      return NextResponse.json({ success: false, error: "A new version of this ad is already waiting for review" }, { status: 409 });
    }
    console.error("[POST /api/ads/[id]/swap]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/ads/[id]/swap — withdraw the version waiting for review
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const row = await ownAd(id, (session.user as any).id);
    if (!row) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    const [withdrawn] = await db.update(adSwaps).set({ status: "withdrawn" })
      .where(and(eq(adSwaps.adId, id), eq(adSwaps.status, "pending"))).returning({ id: adSwaps.id });
    if (!withdrawn) return NextResponse.json({ success: false, error: "Nothing is waiting for review" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/ads/[id]/swap]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
