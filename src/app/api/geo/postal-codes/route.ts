import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { postalCodes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const cityId = new URL(req.url).searchParams.get("cityId");
  if (!cityId) return NextResponse.json({ success: false, error: "cityId required" }, { status: 400 });
  const rows = await db.select({ id: postalCodes.id, name: postalCodes.code, code: postalCodes.code }).from(postalCodes).where(eq(postalCodes.cityId, cityId)).orderBy(asc(postalCodes.code));
  return NextResponse.json({ success: true, data: rows });
}
