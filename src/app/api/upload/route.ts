import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/storage/r2";
import { requireAuth } from "@/lib/auth/session";
import { nanoid } from "nanoid";

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "ads";

    if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ success: false, error: "Invalid file type. JPEG, PNG, WebP or GIF only." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ success: false, error: "File too large. Max 10 MB." }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `${folder}/${nanoid()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
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
