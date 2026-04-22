import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { verifications, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { send2FACodeEmail } from "@/lib/email/templates";
import { randomInt } from "node:crypto";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true, email: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled) {
    return NextResponse.json({ required: false });
  }

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(verifications).where(eq(verifications.identifier, `2fa_code:${userId}`));
  await db.insert(verifications).values({ identifier: `2fa_code:${userId}`, value: code, expiresAt });

  await send2FACodeEmail({ to: user.email, name: user.name, code });

  return NextResponse.json({ required: true });
}
