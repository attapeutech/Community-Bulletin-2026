import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, locations, users } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/locations/[id]/ads — all ads at a location (store owner or admin)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role as string;
    const userId = (session.user as any).id as string;
    const { id } = await params;

    const [location] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    if (!location) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (role !== "admin" && location.storeOwnerId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const rows = await db
      .select({
        id: ads.id,
        title: ads.title,
        imageUrl: ads.imageUrl,
        status: ads.status,
        paymentStatus: ads.paymentStatus,
        displayOrder: ads.displayOrder,
        startedAt: ads.startedAt,
        endedAt: ads.endedAt,
        createdAt: ads.createdAt,
        user: { id: users.id, name: users.name, email: users.email },
      })
      .from(ads)
      .innerJoin(users, eq(ads.userId, users.id))
      .where(eq(ads.locationId, id))
      .orderBy(asc(ads.displayOrder), desc(ads.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("[GET /api/locations/[id]/ads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/locations/[id]/ads — bulk update displayOrder for carousel reordering
const reorderSchema = z.object({
  order: z.array(z.object({ adId: z.string().uuid(), displayOrder: z.number().int().min(0) })),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role as string;
    const userId = (session.user as any).id as string;
    const { id } = await params;

    const [location] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    if (!location) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (role !== "admin" && location.storeOwnerId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { order } = reorderSchema.parse(body);

    // Update each ad's displayOrder
    await Promise.all(
      order.map(({ adId, displayOrder }) =>
        db.update(ads)
          .set({ displayOrder, updatedAt: new Date() })
          .where(eq(ads.id, adId))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    console.error("[PATCH /api/locations/[id]/ads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
