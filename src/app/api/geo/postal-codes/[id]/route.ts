import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { postalCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { code } = await req.json();
    if (!code?.trim()) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 422 });
    }
    const [row] = await db.update(postalCodes).set({ code: code.trim().toUpperCase() }).where(eq(postalCodes.id, id)).returning();
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    console.error("[PATCH /api/geo/postal-codes/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [row] = await db.delete(postalCodes).where(eq(postalCodes.id, id)).returning({ id: postalCodes.id });
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "23503") return NextResponse.json({ success: false, error: "Cannot delete — locations are linked to this postal code" }, { status: 409 });
    console.error("[DELETE /api/geo/postal-codes/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
