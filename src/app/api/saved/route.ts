import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, savedAds } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ adId: z.string().uuid() });

async function currentUserId() {
  const session = await getSession();
  return (session?.user as any)?.id as string | undefined;
}

const unauthorized = () => NextResponse.json({ success: false, error: "Sign in to save ads" }, { status: 401 });

// GET /api/saved — ids of the ads the signed-in user has saved (to fill in heart icons)
export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const rows = await db
      .select({ adId: savedAds.adId })
      .from(savedAds)
      .where(eq(savedAds.userId, userId))
      .orderBy(desc(savedAds.createdAt));
    return NextResponse.json({ success: true, data: { adIds: rows.map(r => r.adId) } });
  } catch (error: any) {
    console.error("[GET /api/saved]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/saved { adId } — save an ad (no-op if already saved)
export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });

    const [ad] = await db.select({ id: ads.id }).from(ads).where(eq(ads.id, parsed.data.adId)).limit(1);
    if (!ad) return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });

    await db.insert(savedAds).values({ userId, adId: ad.id }).onConflictDoNothing();
    return NextResponse.json({ success: true, data: { saved: true } });
  } catch (error: any) {
    console.error("[POST /api/saved]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/saved?adId=… — remove an ad from the user's saved list
export async function DELETE(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const parsed = bodySchema.safeParse({ adId: req.nextUrl.searchParams.get("adId") });
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });

    await db.delete(savedAds).where(and(eq(savedAds.userId, userId), eq(savedAds.adId, parsed.data.adId)));
    return NextResponse.json({ success: true, data: { saved: false } });
  } catch (error: any) {
    console.error("[DELETE /api/saved]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
