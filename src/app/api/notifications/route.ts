import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/notifications — latest in-app notifications + unread count
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;
    const mine = and(eq(notifications.userId, userId), eq(notifications.channel, "socket"));

    const items = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        subject: notifications.subject,
        body: notifications.body,
        link: notifications.link,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(mine)
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const [{ unread }] = await db
      .select({ unread: count() })
      .from(notifications)
      .where(and(mine, isNull(notifications.readAt)));

    return NextResponse.json({ success: true, data: { items, unread } });
  } catch (error: any) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const markSchema = z.union([
  z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }),
  z.object({ all: z.literal(true) }),
]);

// PATCH /api/notifications — mark some (ids) or all notifications read
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const parsed = markSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }

    const conditions = [eq(notifications.userId, userId), isNull(notifications.readAt)];
    if ("ids" in parsed.data) conditions.push(inArray(notifications.id, parsed.data.ids));

    await db.update(notifications).set({ readAt: new Date() }).where(and(...conditions));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PATCH /api/notifications]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
