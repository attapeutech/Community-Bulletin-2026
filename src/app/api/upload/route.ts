import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/storage/r2";
import { shrinkImage } from "@/lib/storage/shrink-image";
import { requireAuth } from "@/lib/auth/session";
import { nanoid } from "nanoid";

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (before shrinking)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Folders the site's forms upload to (private files such as equipment photos use their own route)
const FOLDERS = ["ads", "avatars", "locations"];

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "ads";

    if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    if (!FOLDERS.includes(folder)) return NextResponse.json({ success: false, error: "Invalid folder" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ success: false, error: "Invalid file type. JPEG, PNG, WebP or GIF only." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ success: false, error: "File too large. Max 10 MB." }, { status: 400 });

    const original = Buffer.from(await file.arrayBuffer());
    const ext0 = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";

    // Shrink big photos to screen size (store screens hold every slide in memory)
    let img: { body: Buffer; contentType: string; ext: string } = { body: original, contentType: file.type, ext: ext0 };
    try {
      img = await shrinkImage(original, file.type, ext0);
    } catch (e) {
      // Not readable as an image by sharp: refuse rather than store something screens can't show
      console.error("[POST /api/upload] shrink failed", e);
      return NextResponse.json({ success: false, error: "That image couldn't be read. Try a JPEG or PNG." }, { status: 400 });
    }

    const key = `${folder}/${nanoid()}.${img.ext}`;
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: img.body,
      ContentType: img.contentType,
    }));

    return NextResponse.json({
      success: true,
      data: { key, publicUrl: `${PUBLIC_URL}/${key}` },
    });
  } catch (error: any) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
