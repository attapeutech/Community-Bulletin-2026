import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { screenDevices, locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

const patchSchema = z.object({
  locationId: z.string().uuid().nullable().optional(),
  label: z.string().max(80).nullable().optional(),
});

// PATCH /api/admin/screens/[id] — admin: assign a screen to a location (null = unassign) or label it
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const data = patchSchema.parse(await req.json());

    if (data.locationId) {
      const [loc] = await db.select({ id: locations.id }).from(locations)
        .where(eq(locations.id, data.locationId)).limit(1);
      if (!loc) return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(screenDevices)
      .set({
        ...(data.locationId !== undefined ? { locationId: data.locationId, assignedAt: data.locationId ? new Date() : null } : {}),
        ...(data.label !== undefined ? { label: data.label?.trim() || null } : {}),
      })
      .where(eq(screenDevices.id, id))
      .returning({ id: screenDevices.id });
    if (!updated) return NextResponse.json({ success: false, error: "Screen not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    console.error("[PATCH /api/admin/screens/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
