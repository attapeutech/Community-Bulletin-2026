import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { equipmentPhotos } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { createSignedReadUrl, deleteFile } from "@/lib/storage/r2";

async function adminOnly() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return null;
}

async function findPhoto(photoId: string) {
  if (!z.string().uuid().safeParse(photoId).success) return null;
  const [row] = await db.select().from(equipmentPhotos).where(eq(equipmentPhotos.id, photoId)).limit(1);
  return row ?? null;
}

// GET /api/admin/equipment/photos/[photoId]?size=thumb — admin: redirect to a 10-minute signed link
// (used directly as <img src>, so the page never holds a lasting link to the file)
export async function GET(req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  try {
    const denied = await adminOnly();
    if (denied) return denied;
    const photo = await findPhoto((await params).photoId);
    if (!photo) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    const key = req.nextUrl.searchParams.get("size") === "thumb" ? photo.thumbKey : photo.key;
    const url = await createSignedReadUrl(key);
    // The browser may reuse the redirect for a few minutes (shorter than the link lasts)
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("[GET /api/admin/equipment/photos/[photoId]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/equipment/photos/[photoId] — admin: remove a photo and its files
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  try {
    const denied = await adminOnly();
    if (denied) return denied;
    const photo = await findPhoto((await params).photoId);
    if (!photo) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    await db.delete(equipmentPhotos).where(eq(equipmentPhotos.id, photo.id));
    await Promise.allSettled([deleteFile(photo.key), deleteFile(photo.thumbKey)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/equipment/photos/[photoId]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
