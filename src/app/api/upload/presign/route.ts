import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/storage/r2";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";

const schema = z.object({
  fileName: z.string().min(1),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]),
  folder: z.enum(["ads", "avatars"]).default("ads"),
});

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { fileName, contentType, folder } = schema.parse(body);

    const result = await createPresignedUploadUrl({
      folder,
      fileName,
      contentType,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
