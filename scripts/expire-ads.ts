/**
 * expire-ads.ts
 *
 * Marks ads as "expired" when their endedAt date has passed and they are
 * still in "approved" status.
 *
 * Run manually:   npx tsx scripts/expire-ads.ts
 * Cron (daily):   0 0 * * *  cd /app && npx tsx scripts/expire-ads.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ads } from "../src/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function expireAds() {
  const now = new Date();
  console.log(`[expire-ads] Running at ${now.toISOString()}`);

  const expired = await db
    .update(ads)
    .set({ status: "expired", updatedAt: now })
    .where(
      and(
        eq(ads.status, "approved"),
        lt(ads.endedAt, now)
      )
    )
    .returning({ id: ads.id, title: ads.title, endedAt: ads.endedAt });

  if (expired.length === 0) {
    console.log("[expire-ads] No ads to expire.");
  } else {
    console.log(`[expire-ads] Expired ${expired.length} ad(s):`);
    expired.forEach(a => {
      console.log(`  - [${a.id}] "${a.title}" (ended ${a.endedAt.toISOString()})`);
    });
  }

  await pool.end();
  console.log("[expire-ads] Done.");
}

expireAds().catch(err => {
  console.error("[expire-ads] Fatal error:", err);
  process.exit(1);
});
