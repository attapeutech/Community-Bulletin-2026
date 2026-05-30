import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { states } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { name, code } = await req.json();
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ success: false, error: "Name and code are required" }, { status: 422 });
    }
    const [row] = await db.update(states).set({
      name: name.trim(),
      code: code.trim().toUpperCase(),
    }).where(eq(states.id, id)).returning();
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    console.error("[PATCH /api/geo/states/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [row] = await db.delete(states).where(eq(states.id, id)).returning({ id: states.id });
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "23503") return NextResponse.json({ success: false, error: "Cannot delete — cities are linked to this state" }, { status: 409 });
    console.error("[DELETE /api/geo/states/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
