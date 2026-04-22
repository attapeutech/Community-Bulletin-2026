import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { verifications } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });

  const userId = session.user.id as string;
  const now = new Date();

  const record = await db.query.verifications.findFirst({
    where: and(
      eq(verifications.identifier, `2fa_code:${userId}`),
      gt(verifications.expiresAt, now)
    ),
  });

  if (!record || record.value !== String(code).trim()) {
    return NextResponse.json({ error: "Invalid or expired code. Please try again." }, { status: 400 });
  }

  // Consume the code
  await db.delete(verifications).where(eq(verifications.identifier, `2fa_code:${userId}`));

  // Mark this session as 2FA-verified (expires with the session — 7 days)
  const sessionToken = (session as any).session?.token as string;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .insert(verifications)
    .values({ identifier: `2fa_ok:${sessionToken}`, value: userId, expiresAt })
    .onConflictDoUpdate({
      target: verifications.identifier,
      set: { value: userId, expiresAt, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
