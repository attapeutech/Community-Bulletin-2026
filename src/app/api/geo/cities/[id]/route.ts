import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { cities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 422 });
    }
    const [row] = await db.update(cities).set({ name: name.trim() }).where(eq(cities.id, id)).returning();
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    console.error("[PATCH /api/geo/cities/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [row] = await db.delete(cities).where(eq(cities.id, id)).returning({ id: cities.id });
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "23503") return NextResponse.json({ success: false, error: "Cannot delete — postal codes or locations are linked to this city" }, { status: 409 });
    console.error("[DELETE /api/geo/cities/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
