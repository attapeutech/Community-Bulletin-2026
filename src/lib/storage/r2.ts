import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  // Disable automatic checksums — they break CORS preflight on R2
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

export type UploadFolder = "ads" | "avatars";

/**
 * Generate a presigned upload URL (browser uploads directly to R2)
 */
export async function createPresignedUploadUrl({
  folder,
  fileName,
  contentType,
  expiresIn = 300, // 5 minutes
}: {
  folder: UploadFolder;
  fileName: string;
  contentType: string;
  expiresIn?: number;
}) {
  const ext = fileName.split(".").pop();
  const key = `${folder}/${nanoid()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2, command, { expiresIn });

  return {
    uploadUrl: url,
    key,
    publicUrl: `${PUBLIC_URL}/${key}`,
  };
}

/**
 * Delete a file from R2 by its object key
 */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await r2.send(command);
}

/**
 * Build a public CDN URL from an object key
 */
export function getPublicUrl(key: string) {
  return `${PUBLIC_URL}/${key}`;
}
