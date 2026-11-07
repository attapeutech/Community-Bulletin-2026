import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { locationSetup } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/secret-box";

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/admin/location-setup/[locationId]/password — admin: the store's WiFi password, decrypted
// (only when an admin clicks "Show"; never part of the page itself)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403, headers: NO_STORE });
    }
    const { locationId } = await params;
    if (!z.string().uuid().safeParse(locationId).success) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404, headers: NO_STORE });
    }
    const [row] = await db.select({ enc: locationSetup.wifiPasswordEnc }).from(locationSetup)
      .where(eq(locationSetup.locationId, locationId)).limit(1);
    if (!row?.enc) return NextResponse.json({ success: false, error: "No password saved" }, { status: 404, headers: NO_STORE });

    try {
      return NextResponse.json({ success: true, data: { password: decryptSecret(row.enc) } }, { headers: NO_STORE });
    } catch {
      // Wrong or missing key (e.g. .env.local and Coolify have different ENCRYPTION_KEY values)
      return NextResponse.json(
        { success: false, error: "Can't read this password with the server's ENCRYPTION_KEY. Re-type it, or check the key matches." },
        { status: 500, headers: NO_STORE },
      );
    }
  } catch (error) {
    console.error("[GET /api/admin/location-setup/[locationId]/password]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500, headers: NO_STORE });
  }
}
