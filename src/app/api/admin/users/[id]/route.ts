import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users, ads, payments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin();
  const currentUserId = (session.user as any).id as string;

  if (id === currentUserId) {
    return NextResponse.json({ success: false, error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    // Clear reviewedBy references so we can delete the user without FK violation
    await db.update(ads).set({ reviewedBy: null }).where(eq(ads.reviewedBy, id));

    // Collect this user's ad IDs
    const userAds = await db.select({ id: ads.id }).from(ads).where(eq(ads.userId, id));
    const adIds = userAds.map(a => a.id);

    // Delete payments (restrict FK — must precede ad deletion)
    await db.delete(payments).where(eq(payments.userId, id));
    if (adIds.length > 0) {
      await db.delete(payments).where(inArray(payments.adId, adIds));
    }

    // Delete ads (notifications cascade via onDelete: "cascade")
    await db.delete(ads).where(eq(ads.userId, id));

    // Delete user (sessions, accounts, twoFactors cascade)
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Failed to delete user" }, { status: 500 });
  }
}
