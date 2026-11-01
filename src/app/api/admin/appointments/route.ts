import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appointments, leads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { appointmentSchema } from "./schema";

// POST /api/admin/appointments — schedule an appointment with a lead
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const parsed = appointmentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    const d = parsed.data;

    const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, d.leadId)).limit(1);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });

    const [row] = await db.insert(appointments).values({
      leadId: d.leadId,
      type: d.type,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      place: d.place,
      notes: d.notes,
      createdBy: (session.user as any).id,
    }).returning({ id: appointments.id });

    return NextResponse.json({ success: true, data: { id: row.id } });
  } catch (error) {
    console.error("[POST /api/admin/appointments]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
