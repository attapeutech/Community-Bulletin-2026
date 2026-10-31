import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { demos, leads, locations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { demoExpiry, newDemoToken } from "@/lib/demos";

const schema = z.object({ leadId: z.string().uuid() });

// POST /api/admin/demos — start a demo for an advertiser lead, on the store they'd advertise at
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });

    const [lead] = await db
      .select({ id: leads.id, kind: leads.kind, locationId: locations.id })
      .from(leads)
      .leftJoin(locations, and(eq(leads.locationId, locations.id), eq(locations.isActive, true)))
      .where(eq(leads.id, parsed.data.leadId))
      .limit(1);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    if (lead.kind !== "advertiser") return NextResponse.json({ success: false, error: "Demos are for advertiser leads" }, { status: 422 });
    if (!lead.locationId) return NextResponse.json({ success: false, error: "Choose the store they'd advertise at first" }, { status: 422 });

    const [demo] = await db.insert(demos).values({
      leadId: lead.id,
      locationId: lead.locationId,
      token: newDemoToken(),
      createdBy: (session.user as any).id,
      expiresAt: demoExpiry(),
    }).returning({ id: demos.id });

    return NextResponse.json({ success: true, data: { id: demo.id } });
  } catch (error) {
    console.error("[POST /api/admin/demos]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
