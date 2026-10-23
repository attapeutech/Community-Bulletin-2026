import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users, sessions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

const schema = z.object({
  banned: z.boolean(),
  banReason: z.string().max(300).optional(),
});

// PATCH /api/admin/users/[id]/ban — ban or unban a user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const { id } = await params;

    if (id === adminId) {
      return NextResponse.json({ success: false, error: "Cannot ban yourself" }, { status: 400 });
    }

    const body = await req.json();
    const { banned, banReason } = schema.parse(body);

    const [updated] = await db
      .update(users)
      .set({
        banned,
        banReason: banned ? (banReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, banned: users.banned });

    if (!updated) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Revoke all active sessions when banning so they're kicked out immediately
    if (banned) {
      await db.delete(sessions).where(eq(sessions.userId, id));
    }

    console.log(`[Admin] User ${id} ${banned ? "banned" : "unbanned"} by admin ${adminId}`);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    console.error("[PATCH /api/admin/users/[id]/ban]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
