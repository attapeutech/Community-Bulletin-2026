import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

const schema = z.object({ manualPayoutAllowed: z.boolean() });

// PATCH /api/admin/direct-deposits/owner/[id] — admin: allow (or stop) paying this owner by Zelle/check
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });

    const [updated] = await db
      .update(users)
      .set({ manualPayoutAllowed: parsed.data.manualPayoutAllowed, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.role, "store_owner")))
      .returning({ id: users.id });
    if (!updated) return NextResponse.json({ success: false, error: "Store owner not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/direct-deposits/owner/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
