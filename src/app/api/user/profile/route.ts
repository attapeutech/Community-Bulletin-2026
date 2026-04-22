import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users, verifications } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const userId = session.user.id as string;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.twoFactorEnabled !== undefined) {
    updates.twoFactorEnabled = parsed.data.twoFactorEnabled;
    // When disabling 2FA, clear all verified sessions for this user
    if (!parsed.data.twoFactorEnabled) {
      await db.delete(verifications).where(like(verifications.identifier, `2fa_ok:%`));
    }
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
