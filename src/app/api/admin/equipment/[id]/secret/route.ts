import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { equipment } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/secret-box";
import { REMOTE_SECRET_FIELDS } from "@/lib/equipment";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status, headers: NO_STORE });

// GET /api/admin/equipment/[id]/secret?field=password|pin|windows — admin: a remote access secret, decrypted
// (only when an admin clicks "Show"; never part of the page itself)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return fail("Unauthorized", 401);
    if ((session.user as any).role !== "admin") return fail("Forbidden", 403);

    const { id } = await params;
    const field = z.enum(REMOTE_SECRET_FIELDS).safeParse(req.nextUrl.searchParams.get("field"));
    if (!z.string().uuid().safeParse(id).success || !field.success) return fail("Not found", 404);

    const [row] = await db
      .select({ password: equipment.remoteAccountPasswordEnc, pin: equipment.remotePinEnc, windows: equipment.windowsPasswordEnc })
      .from(equipment).where(eq(equipment.id, id)).limit(1);
    const enc = row?.[field.data];
    if (!enc) return fail("Nothing saved", 404);

    try {
      return NextResponse.json({ success: true, data: { value: decryptSecret(enc) } }, { headers: NO_STORE });
    } catch {
      return fail("Can't read this with the server's ENCRYPTION_KEY. Re-type it, or check the key matches.", 500);
    }
  } catch (error) {
    console.error("[GET /api/admin/equipment/[id]/secret]", error);
    return fail("Internal server error", 500);
  }
}
