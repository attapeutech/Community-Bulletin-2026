import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { equipment, equipmentPhotos } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { deleteFile, putFile } from "@/lib/storage/r2";

const MAX_PHOTOS = 12;
const MAX_FULL = 5 * 1024 * 1024;  // the browser shrinks photos to ~1600 px first, so this is generous
const MAX_THUMB = 1024 * 1024;

// The browser re-encodes every photo as JPEG (which also drops GPS/EXIF data); check the bytes, not the label
async function jpegBytes(v: FormDataEntryValue | null, max: number): Promise<Buffer | null> {
  if (!v || typeof v === "string" || v.size === 0 || v.size > max) return null;
  const buf = Buffer.from(await v.arrayBuffer());
  return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff ? buf : null;
}

// POST /api/admin/equipment/[id]/photos — admin: add a photo (form fields "file" and "thumb", both JPEG)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }

  let keys: string[] = [];
  try {
    const [item] = await db.select({ id: equipment.id }).from(equipment).where(eq(equipment.id, id)).limit(1);
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    const [{ n }] = await db.select({ n: count() }).from(equipmentPhotos).where(eq(equipmentPhotos.equipmentId, id));
    if (n >= MAX_PHOTOS) {
      return NextResponse.json({ success: false, error: `Up to ${MAX_PHOTOS} photos per item` }, { status: 409 });
    }

    const form = await req.formData();
    const full = await jpegBytes(form.get("file"), MAX_FULL);
    const thumb = await jpegBytes(form.get("thumb"), MAX_THUMB);
    if (!full || !thumb) {
      return NextResponse.json({ success: false, error: "That photo couldn't be read. Try another one." }, { status: 400 });
    }

    const base = `files/equipment/${id}/${nanoid()}`;
    keys = [`${base}.jpg`, `${base}-thumb.jpg`];
    await putFile(keys[0], full, "image/jpeg");
    await putFile(keys[1], thumb, "image/jpeg");

    const [row] = await db.insert(equipmentPhotos)
      .values({ equipmentId: id, key: keys[0], thumbKey: keys[1], uploadedBy: session.user.id })
      .returning({ id: equipmentPhotos.id });
    return NextResponse.json({ success: true, data: { id: row.id } });
  } catch (error: any) {
    // Don't leave files behind if the database step failed
    await Promise.allSettled(keys.map((k) => deleteFile(k)));
    if (error.code === "23503" || error.cause?.code === "23503") {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    console.error("[POST /api/admin/equipment/[id]/photos]", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
