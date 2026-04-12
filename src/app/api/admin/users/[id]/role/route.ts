import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAdmin, getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

const schema = z.object({
  role: z.enum(["user", "store_owner", "approver", "admin"]),
});

// PATCH /api/admin/users/[id]/role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const { id } = await params;

    // Prevent self-demotion
    if (id === adminId) {
      return NextResponse.json({ success: false, error: "Cannot change your own role" }, { status: 400 });
    }

    const body = await req.json();
    const { role } = schema.parse(body);

    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    if (!updated) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 422 });
    }
    console.error("[PATCH /api/admin/users/[id]/role]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
