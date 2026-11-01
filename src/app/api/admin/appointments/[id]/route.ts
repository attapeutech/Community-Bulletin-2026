import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appointments } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { appointmentSchema } from "../schema";

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

// PATCH /api/admin/appointments/[id] — change an appointment (all fields, as in the form)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    const parsed = appointmentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    const d = parsed.data;

    const [row] = await db.update(appointments).set({
      leadId: d.leadId,
      type: d.type,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      place: d.place,
      notes: d.notes,
      updatedAt: new Date(),
    }).where(eq(appointments.id, id)).returning({ id: appointments.id });
    if (!row) return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/appointments/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/appointments/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    const [row] = await db.delete(appointments).where(eq(appointments.id, id)).returning({ id: appointments.id });
    if (!row) return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/appointments/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
