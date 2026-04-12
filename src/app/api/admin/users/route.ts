import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { desc } from "drizzle-orm";

// GET /api/admin/users — full user list
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        twoFactorEnabled: users.twoFactorEnabled,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
