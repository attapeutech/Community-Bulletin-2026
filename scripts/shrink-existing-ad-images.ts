// One-time: shrink ad images uploaded before /api/upload started resizing (2026-11-09).
// Makes a smaller copy of each large image (max 1920 px, see src/lib/storage/shrink-image.ts) and
// points ads and ad swaps at the copy. Originals are NOT deleted (several rows can share one file).
//
//   npx tsx scripts/shrink-existing-ad-images.ts           report only (changes nothing)
//   npx tsx scripts/shrink-existing-ad-images.ts --apply   upload copies and update the rows
//
// Uses .env.local (DATABASE_URL, CLOUDFLARE_R2_*). Safe to run again: small images are skipped.
import { config } from "dotenv";
config({ path: ".env.local" });
import { Client } from "pg";
import { nanoid } from "nanoid";

const APPLY = process.argv.includes("--apply");

(async () => {
  const { shrinkImage } = await import("../src/lib/storage/shrink-image");
  const { putFile, getPublicUrl } = await import("../src/lib/storage/r2");

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const { rows } = await db.query<{ image_key: string; image_url: string }>(`
    select distinct image_key, image_url from (
      select image_key, image_url from ads
      union all
      select image_key, image_url from ad_swaps
    ) t where image_url is not null`);

  let shrunk = 0, before = 0, after = 0, failed = 0;
  for (const { image_key, image_url } of rows) {
    try {
      const res = await fetch(image_url);
      if (!res.ok) { console.log(`skip (HTTP ${res.status}) ${image_key}`); failed++; continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const type = res.headers.get("content-type") ?? "image/jpeg";
      const ext = image_key.split(".").pop() ?? "jpg";
      const out = await shrinkImage(buf, type, ext);
      if (!out.changed) continue;

      shrunk++; before += buf.length; after += out.body.length;
      console.log(`${(buf.length / 1e6).toFixed(2)} MB -> ${(out.body.length / 1e6).toFixed(2)} MB  ${image_key}`);
      if (!APPLY) continue;

      const newKey = `ads/${nanoid()}.${out.ext}`;
      await putFile(newKey, out.body, out.contentType);
      const newUrl = getPublicUrl(newKey);
      const a = await db.query("update ads set image_url = $1, image_key = $2 where image_key = $3", [newUrl, newKey, image_key]);
      const s = await db.query("update ad_swaps set image_url = $1, image_key = $2 where image_key = $3", [newUrl, newKey, image_key]);
      console.log(`   -> ${newKey} (${a.rowCount} ad${a.rowCount === 1 ? "" : "s"}, ${s.rowCount} swap${s.rowCount === 1 ? "" : "s"}); original kept`);
    } catch (e: any) {
      failed++;
      console.log(`error ${image_key}: ${e.message}`);
    }
  }
  await db.end();
  console.log(`\n${rows.length} images checked, ${shrunk} ${APPLY ? "shrunk" : "would be shrunk"}: ` +
    `${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB${failed ? `, ${failed} skipped/failed` : ""}.` +
    (APPLY ? "" : "\nNothing changed. Run with --apply to do it."));
})();
