import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { states } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const countryId = new URL(req.url).searchParams.get("countryId");
  if (!countryId) return NextResponse.json({ success: false, error: "countryId required" }, { status: 400 });
  const rows = await db.select({ id: states.id, name: states.name, code: states.code }).from(states).where(eq(states.countryId, countryId)).orderBy(asc(states.name));
  return NextResponse.json({ success: true, data: rows });
}
