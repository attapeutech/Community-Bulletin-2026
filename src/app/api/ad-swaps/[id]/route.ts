import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, adSwaps, locations, users } from "@/lib/db/schema";
import { requireApproverOrAdmin } from "@/lib/auth/session";
import { and, eq } from "drizzle-orm";
import { canSwap } from "@/lib/ad-swaps";
import { notifyUser } from "@/lib/notifications";
import { sendAdSwapResultEmail } from "@/lib/email/templates";
import { pushDisplayRefresh } from "@/lib/socket/notify";

const reviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("deny"), reviewNote: z.string().trim().min(10).max(500) }),
]);

// PATCH /api/ad-swaps/[id] — approve (the new version replaces the running ad, same end date) or deny
// (the current ad keeps running). No payment either way.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApproverOrAdmin();
    const reviewerId = (session.user as any).id as string;
    const { id } = await params;
    const body = reviewSchema.parse(await req.json());

    const [row] = await db
      .select({ swap: adSwaps, ad: ads, user: { id: users.id, name: users.name, email: users.email }, slug: locations.slug })
      .from(adSwaps)
      .innerJoin(ads, eq(adSwaps.adId, ads.id))
      .innerJoin(users, eq(ads.userId, users.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .where(eq(adSwaps.id, id))
      .limit(1);
    if (!row) return NextResponse.json({ success: false, error: "Swap not found" }, { status: 404 });
    if (row.swap.status !== "pending") {
      return NextResponse.json({ success: false, error: "This swap was already reviewed or withdrawn" }, { status: 409 });
    }

    const now = new Date();
    const endsOn = row.ad.endedAt.toLocaleDateString("en-US", { dateStyle: "long" });
    const s = row.swap;

    if (body.action === "approve") {
      if (!canSwap(row.ad, now)) {
        return NextResponse.json({ success: false, error: "The ad is no longer running, so the swap can't be approved" }, { status: 409 });
      }
      const done = await db.transaction(async (tx) => {
        const [claimed] = await tx.update(adSwaps)
          .set({ status: "approved", reviewedBy: reviewerId, reviewedAt: now })
          .where(and(eq(adSwaps.id, id), eq(adSwaps.status, "pending")))
          .returning({ id: adSwaps.id });
        if (!claimed) return false;
        // Copy the new version onto the same ad: payment, earnings, dates, QR link and counts stay
        await tx.update(ads).set({
          title: s.title, description: s.description, imageUrl: s.imageUrl, imageKey: s.imageKey,
          contactPhone: s.contactPhone, contactAddress: s.contactAddress, contactWebsite: s.contactWebsite,
          showPhone: s.showPhone, showAddress: s.showAddress, showWebsite: s.showWebsite,
          template: s.template, templateData: s.templateData,
          reviewedBy: reviewerId, reviewedAt: now, updatedAt: now,
        }).where(eq(ads.id, row.ad.id));
        return true;
      });
      if (!done) return NextResponse.json({ success: false, error: "This swap was already reviewed or withdrawn" }, { status: 409 });

      await notifyUser(row.user.id, {
        type: "ad_approved",
        adId: row.ad.id,
        subject: `Your new ad "${s.title}" is live`,
        body: `It replaced "${row.ad.title}" and shows until ${endsOn}.`,
        link: `/dashboard/user/ads/${row.ad.id}`,
      });
      sendAdSwapResultEmail({ to: row.user.email, userName: row.user.name, adTitle: s.title, adId: row.ad.id, approved: true, endedAt: endsOn }).catch(console.error);
      pushDisplayRefresh(row.slug).catch(console.error);
    } else {
      const [denied] = await db.update(adSwaps)
        .set({ status: "denied", reviewNote: body.reviewNote, reviewedBy: reviewerId, reviewedAt: now })
        .where(and(eq(adSwaps.id, id), eq(adSwaps.status, "pending")))
        .returning({ id: adSwaps.id });
      if (!denied) return NextResponse.json({ success: false, error: "This swap was already reviewed or withdrawn" }, { status: 409 });

      await notifyUser(row.user.id, {
        type: "ad_denied",
        adId: row.ad.id,
        subject: `Your ad swap "${s.title}" wasn't approved`,
        body: `Your current ad "${row.ad.title}" keeps running. See the reviewer's note in My Ads.`,
        link: "/dashboard/user",
      });
      sendAdSwapResultEmail({ to: row.user.email, userName: row.user.name, adTitle: s.title, adId: row.ad.id, approved: false, reviewNote: body.reviewNote, endedAt: endsOn }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "A reason of at least 10 characters is required" }, { status: 422 });
    }
    console.error("[PATCH /api/ad-swaps/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
