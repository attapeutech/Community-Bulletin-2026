import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

// GET /api/users/me — returns current user's profile including default contacts
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const [user] = await db
      .select({
        defaultPhone:   users.defaultPhone,
        defaultAddress: users.defaultAddress,
        defaultWebsite: users.defaultWebsite,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        phone:   user?.defaultPhone   ?? null,
        address: user?.defaultAddress ?? null,
        website: user?.defaultWebsite ?? null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}
