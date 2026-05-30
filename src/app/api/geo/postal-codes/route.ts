import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { postalCodes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const cityId = new URL(req.url).searchParams.get("cityId");
  if (!cityId) return NextResponse.json({ success: false, error: "cityId required" }, { status: 400 });
  const rows = await db.select({ id: postalCodes.id, name: postalCodes.code, code: postalCodes.code }).from(postalCodes).where(eq(postalCodes.cityId, cityId)).orderBy(asc(postalCodes.code));
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { stateId, cityId, code } = await req.json();
    if (!stateId || !cityId || !code?.trim()) {
      return NextResponse.json({ success: false, error: "stateId, cityId, and code are required" }, { status: 422 });
    }
    const [row] = await db.insert(postalCodes).values({
      stateId,
      cityId,
      code: code.trim().toUpperCase(),
    }).returning();
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/geo/postal-codes]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

