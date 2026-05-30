import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { cities } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const stateId = new URL(req.url).searchParams.get("stateId");
  if (!stateId) return NextResponse.json({ success: false, error: "stateId required" }, { status: 400 });
  const rows = await db.select({ id: cities.id, name: cities.name }).from(cities).where(eq(cities.stateId, stateId)).orderBy(asc(cities.name));
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { stateId, name } = await req.json();
    if (!stateId || !name?.trim()) {
      return NextResponse.json({ success: false, error: "stateId and name are required" }, { status: 422 });
    }
    const [row] = await db.insert(cities).values({
      stateId,
      name: name.trim(),
    }).returning();
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/geo/cities]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

