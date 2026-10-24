import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { issueTempPassword, TEMP_PASSWORD_DAYS } from "@/lib/temp-password";

// POST /api/admin/users/[id]/reset-password — issue a new temporary password (shown once)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const { id } = await params;

    if (id === adminId) {
      return NextResponse.json(
        { success: false, error: "Use Account settings to change your own password" },
        { status: 400 }
      );
    }

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const tempPassword = await issueTempPassword(id);

    console.log(`[Admin] Temporary password issued for user ${id} by admin ${adminId}`);
    return NextResponse.json({ success: true, data: { tempPassword, expiresInDays: TEMP_PASSWORD_DAYS } });
  } catch (error: any) {
    console.error("[POST /api/admin/users/[id]/reset-password]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
