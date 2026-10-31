import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, demos, leads, locations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { demoExpiry } from "@/lib/demos";

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

// GET /api/admin/demos/[id] — the demo's lead and store (Post a New Ad fills the demo ad in from them)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ success: false, error: "Demo not found" }, { status: 404 });
    const [demo] = await db
      .select({
        id: demos.id,
        leadId: demos.leadId,
        expiresAt: demos.expiresAt,
        locationSlug: locations.slug,
        businessName: leads.businessName,
        phone: leads.phone,
        address: leads.address,
        city: leads.city,
      })
      .from(demos)
      .innerJoin(leads, eq(demos.leadId, leads.id))
      .innerJoin(locations, eq(demos.locationId, locations.id))
      .where(eq(demos.id, id))
      .limit(1);
    if (!demo) return NextResponse.json({ success: false, error: "Demo not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: demo });
  } catch (error) {
    console.error("[GET /api/admin/demos/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const patchSchema = z.object({ extend: z.literal(true) });

// PATCH /api/admin/demos/[id] — extend the link for another 30 days, from today
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isUuid(id) || !patchSchema.safeParse(await req.json().catch(() => null)).success) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }

    const expiresAt = demoExpiry();
    const [updated] = await db.update(demos).set({ expiresAt }).where(eq(demos.id, id)).returning({ id: demos.id });
    if (!updated) return NextResponse.json({ success: false, error: "Demo not found" }, { status: 404 });

    // Its ads run until the link expires (the nightly job may already have marked them expired)
    await db.update(ads).set({ endedAt: expiresAt, status: "approved", updatedAt: new Date() }).where(eq(ads.demoId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/demos/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/demos/[id] — delete the demo and its demo ads (the link stops working)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ success: false, error: "Demo not found" }, { status: 404 });
    const [deleted] = await db.delete(demos).where(eq(demos.id, id)).returning({ id: demos.id });
    if (!deleted) return NextResponse.json({ success: false, error: "Demo not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/demos/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
