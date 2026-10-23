import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

const schema = z.object({
  emailVerified: z.boolean(),
});

// PATCH /api/admin/users/[id]/email-verified — manually confirm or unconfirm a user's email
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const { id } = await params;

    const body = await req.json();
    const { emailVerified } = schema.parse(body);

    const [updated] = await db
      .update(users)
      .set({ emailVerified, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, emailVerified: users.emailVerified });

    if (!updated) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    console.log(`[Admin] User ${id} email ${emailVerified ? "confirmed" : "unconfirmed"} by admin ${adminId}`);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    console.error("[PATCH /api/admin/users/[id]/email-verified]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
