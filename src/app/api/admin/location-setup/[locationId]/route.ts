import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { locationSetup, locations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { locationSetupSchema } from "@/lib/location-setup";
import { encryptSecret, hasEncryptionKey } from "@/lib/secret-box";

// PATCH /api/admin/location-setup/[locationId] — admin: save a store's WiFi details and/or checklist
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { locationId } = await params;
    if (!z.string().uuid().safeParse(locationId).success) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }
    const [loc] = await db.select({ id: locations.id }).from(locations).where(eq(locations.id, locationId)).limit(1);
    if (!loc) return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });

    const data = locationSetupSchema.parse(await req.json());

    let wifiPasswordEnc: string | null | undefined;
    if (data.wifiPassword !== undefined) {
      if (data.wifiPassword) {
        if (!hasEncryptionKey()) {
          return NextResponse.json({ success: false, error: "Passwords can't be saved yet: ENCRYPTION_KEY isn't set on the server" }, { status: 503 });
        }
        wifiPasswordEnc = encryptSecret(data.wifiPassword);
      } else {
        wifiPasswordEnc = null;
      }
    }

    const values = {
      ...(data.wifiName !== undefined ? { wifiName: data.wifiName } : {}),
      ...(wifiPasswordEnc !== undefined ? { wifiPasswordEnc } : {}),
      ...(data.contactName !== undefined ? { contactName: data.contactName } : {}),
      ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
      ...(data.networkNotes !== undefined ? { networkNotes: data.networkNotes } : {}),
      ...(data.checklist !== undefined ? { checklist: data.checklist } : {}),
      updatedBy: session.user.id,
      updatedAt: new Date(),
    };

    await db.insert(locationSetup)
      .values({ locationId, ...values })
      .onConflictDoUpdate({ target: locationSetup.locationId, set: values });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Please check the form" }, { status: 422 });
    }
    console.error("[PATCH /api/admin/location-setup/[locationId]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
