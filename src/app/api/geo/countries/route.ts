import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { countries } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  const rows = await db.select({ id: countries.id, name: countries.name, code: countries.code }).from(countries).orderBy(asc(countries.name));
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { name, code, phoneCode, currencyCode, currencySymbol } = await req.json();
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ success: false, error: "Name and code are required" }, { status: 422 });
    }
    const [row] = await db.insert(countries).values({
      name: name.trim(),
      code: code.trim().toUpperCase().slice(0, 2),
      phoneCode: phoneCode?.trim() || null,
      currencyCode: currencyCode?.trim().toUpperCase().slice(0, 3) || null,
      currencySymbol: currencySymbol?.trim() || null,
    }).returning();
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "23505") return NextResponse.json({ success: false, error: "Country code already exists" }, { status: 409 });
    console.error("[POST /api/geo/countries]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

