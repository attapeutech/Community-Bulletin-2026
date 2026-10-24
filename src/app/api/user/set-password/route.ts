import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { setUserPassword } from "@/lib/temp-password";

const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// POST /api/user/set-password — replace a temporary password after first login.
// Only allowed while the account is flagged mustChangePassword; otherwise use PATCH /api/user/password.
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth({ allowTempPassword: true });
    const userId = (session.user as any).id as string;

    const [user] = await db
      .select({ mustChangePassword: users.mustChangePassword })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user?.mustChangePassword) {
      return NextResponse.json({ success: false, error: "Use Account settings to change your password" }, { status: 400 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 422 }
      );
    }

    await setUserPassword(userId, parsed.data.newPassword);
    await db
      .update(users)
      .set({ mustChangePassword: false, tempPasswordExpiresAt: null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/user/set-password]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
