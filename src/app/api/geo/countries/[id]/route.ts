import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { countries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { name, code, phoneCode, currencyCode, currencySymbol } = await req.json();
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ success: false, error: "Name and code are required" }, { status: 422 });
    }
    const [row] = await db.update(countries).set({
      name: name.trim(),
      code: code.trim().toUpperCase().slice(0, 2),
      phoneCode: phoneCode?.trim() || null,
      currencyCode: currencyCode?.trim().toUpperCase().slice(0, 3) || null,
      currencySymbol: currencySymbol?.trim() || null,
    }).where(eq(countries.id, id)).returning();
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    if (e?.code === "23505") return NextResponse.json({ success: false, error: "Country code already exists" }, { status: 409 });
    console.error("[PATCH /api/geo/countries/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [row] = await db.delete(countries).where(eq(countries.id, id)).returning({ id: countries.id });
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "23503") return NextResponse.json({ success: false, error: "Cannot delete — states are linked to this country" }, { status: 409 });
    console.error("[DELETE /api/geo/countries/[id]]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
