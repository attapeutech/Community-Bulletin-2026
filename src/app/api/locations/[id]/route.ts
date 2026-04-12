import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

const updateSchema = z.object({
  storeName: z.string().min(2).max(120).optional(),
  addressLine1: z.string().min(5).max(200).optional(),
  addressLine2: z.string().max(100).nullable().optional(),
  displayName: z.string().max(120).nullable().optional(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/locations/[id]
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

    // Only owner or admin can edit
    if (role !== "admin" && location.storeOwnerId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const [updated] = await db
      .update(locations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 422 });
    }
    console.error("[PATCH /api/locations/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
