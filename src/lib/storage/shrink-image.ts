// Server only. Shrinks uploaded images to screen size before they're stored, so store screens
// (which keep slides in memory) and pages load fast. A 4000x3000 phone photo becomes 1920x1440.
import sharp from "sharp";

export const MAX_SIDE = 1920;

export type ShrinkResult = { body: Buffer; contentType: string; ext: string; changed: boolean };

/**
 * Resize to fit MAX_SIDE x MAX_SIDE (never enlarges), apply the photo's rotation, drop metadata
 * (camera info, GPS). Photos become JPEG; images with transparency stay PNG. GIFs (maybe animated)
 * and images already small enough are returned unchanged.
 */
export async function shrinkImage(input: Buffer, contentType: string, ext: string): Promise<ShrinkResult> {
  const same: ShrinkResult = { body: input, contentType, ext, changed: false };
  if (contentType === "image/gif") return same;

  const img = sharp(input, { failOn: "none" });
  const meta = await img.metadata();
  if (!meta.width || !meta.height) return same;

  // EXIF orientations 5-8 swap width and height
  const rotated = (meta.orientation ?? 1) >= 5;
  const w = rotated ? meta.height : meta.width;
  const h = rotated ? meta.width : meta.height;
  const tooBig = Math.max(w, h) > MAX_SIDE;
  // Small enough and not heavy: keep the original exactly
  if (!tooBig && input.length <= 1_500_000) return same;

  const pipeline = img.rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true });
  const out = meta.hasAlpha
    ? { body: await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer(), contentType: "image/png", ext: "png" }
    : { body: await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer(), contentType: "image/jpeg", ext: "jpg" };

  // Only use the new version if it's actually smaller or was too large to show
  if (!tooBig && out.body.length >= input.length) return same;
  return { ...out, changed: true };
}
