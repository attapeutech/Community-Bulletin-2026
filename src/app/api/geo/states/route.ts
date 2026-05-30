import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { states } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const countryId = new URL(req.url).searchParams.get("countryId");
  if (!countryId) return NextResponse.json({ success: false, error: "countryId required" }, { status: 400 });
  const rows = await db.select({ id: states.id, name: states.name, code: states.code }).from(states).where(eq(states.countryId, countryId)).orderBy(asc(states.name));
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { countryId, name, code } = await req.json();
    if (!countryId || !name?.trim() || !code?.trim()) {
      return NextResponse.json({ success: false, error: "countryId, name, and code are required" }, { status: 422 });
    }
    const [row] = await db.insert(states).values({
      countryId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
    }).returning();
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/geo/states]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

