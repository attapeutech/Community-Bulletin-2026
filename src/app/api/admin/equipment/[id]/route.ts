import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { equipment, equipmentPhotos } from "@/lib/db/schema";
import { deleteFile } from "@/lib/storage/r2";
import { getSession } from "@/lib/auth/session";
import { equipmentSchema } from "@/lib/equipment";
import { equipmentColumns, MissingKeyError } from "@/lib/equipment-server";

async function adminOnly() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// PATCH /api/admin/equipment/[id] — admin: edit an item (whole form is sent)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await adminOnly();
    if (denied) return denied;
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const data = equipmentSchema.parse(await req.json());
    const [row] = await db.update(equipment).set({ ...equipmentColumns(data), updatedAt: new Date() })
      .where(eq(equipment.id, id)).returning({ id: equipment.id });
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof MissingKeyError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 503 });
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Please check the form" }, { status: 422 });
    }
    if (error.code === "23503" || error.cause?.code === "23503") {
      return NextResponse.json({ success: false, error: "That store or screen no longer exists" }, { status: 409 });
    }
    console.error("[PATCH /api/admin/equipment/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/equipment/[id] — admin: remove an item (entered by mistake; use "Retired" for old gear)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await adminOnly();
    if (denied) return denied;
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const photos = await db.select({ key: equipmentPhotos.key, thumbKey: equipmentPhotos.thumbKey })
      .from(equipmentPhotos).where(eq(equipmentPhotos.equipmentId, id));
    // Photo rows go with the item (cascade); then remove their files
    const [row] = await db.delete(equipment).where(eq(equipment.id, id)).returning({ id: equipment.id });
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    await Promise.allSettled(photos.flatMap((p) => [deleteFile(p.key), deleteFile(p.thumbKey)]));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/equipment/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
