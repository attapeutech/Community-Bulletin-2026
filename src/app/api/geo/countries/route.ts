import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { countries } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select({ id: countries.id, name: countries.name, code: countries.code }).from(countries).orderBy(asc(countries.name));
  return NextResponse.json({ success: true, data: rows });
}
