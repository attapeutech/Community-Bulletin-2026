import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/health — used by Coolify's health check for zero-downtime deploys.
// Healthy only when the app is serving and the database answers, so traffic never
// switches to a new version that can't reach Postgres.
export async function GET() {
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("database timeout")), 4000)),
    ]);
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("[GET /api/health]", error?.message ?? error);
    return NextResponse.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
