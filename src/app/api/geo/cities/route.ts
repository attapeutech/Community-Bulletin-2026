import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { cities } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const stateId = new URL(req.url).searchParams.get("stateId");
  if (!stateId) return NextResponse.json({ success: false, error: "stateId required" }, { status: 400 });
  const rows = await db.select({ id: cities.id, name: cities.name }).from(cities).where(eq(cities.stateId, stateId)).orderBy(asc(cities.name));
  return NextResponse.json({ success: true, data: rows });
}
