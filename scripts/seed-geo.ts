import * as dotenv from "dotenv";
// Same order as drizzle.config.ts: .env.local wins. dotenv never overrides a
// variable that is already set, so the first file loaded takes precedence.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cities, countries, postalCodes, states } from "../src/lib/db/schema";

/**
 * Geography only -- countries, states, cities and postal codes. Safe for any
 * environment: unlike scripts/seed.ts it creates no users and carries no
 * credentials. Refuses to run twice, since states and cities have no unique
 * constraint to make a second run a no-op.
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (checked .env.local, then .env)");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

async function seedGeo() {
  console.log(`Target host: ${new URL(url!).hostname}`);

  const [{ value: stateCount }] = await db.select({ value: count() }).from(states);
  if (stateCount > 0) {
    console.log(`Geo data already present (${stateCount} states). Nothing to do.`);
    return;
  }

  const [us] = await db
    .insert(countries)
    .values({ name: "United States", code: "US", phoneCode: "+1", currencyCode: "USD", currencySymbol: "$" })
    .onConflictDoNothing()
    .returning();
  const usId = us?.id ?? (await db.select().from(countries).where(eq(countries.code, "US")).limit(1))[0]?.id;
  if (!usId) throw new Error("Could not resolve the United States country row");

  await db.insert(states).values([
    { name: "Washington", code: "WA", countryId: usId },
    { name: "California", code: "CA", countryId: usId },
    { name: "New York", code: "NY", countryId: usId },
    { name: "Texas", code: "TX", countryId: usId },
    { name: "Florida", code: "FL", countryId: usId },
    { name: "Illinois", code: "IL", countryId: usId },
    { name: "Oregon", code: "OR", countryId: usId },
    { name: "Colorado", code: "CO", countryId: usId },
  ]);

  const [wa] = await db.select().from(states).where(eq(states.code, "WA")).limit(1);
  if (!wa) throw new Error("Could not resolve the Washington state row");

  await db.insert(cities).values(
    ["Seattle", "Bellevue", "Tacoma", "Spokane", "Redmond", "Kirkland"].map((name) => ({
      stateId: wa.id,
      name,
    }))
  );

  const [seattle] = await db.select().from(cities).where(eq(cities.name, "Seattle")).limit(1);
  if (!seattle) throw new Error("Could not resolve the Seattle city row");

  await db.insert(postalCodes).values(
    ["98101", "98102", "98103", "98104", "98105", "98109", "98115", "98121"].map((code) => ({
      stateId: wa.id,
      cityId: seattle.id,
      code,
    }))
  );

  const [c] = await db.select({ value: count() }).from(countries);
  const [s] = await db.select({ value: count() }).from(states);
  const [ci] = await db.select({ value: count() }).from(cities);
  const [p] = await db.select({ value: count() }).from(postalCodes);
  console.log(`Seeded: ${c.value} countries, ${s.value} states, ${ci.value} cities, ${p.value} postal codes`);
}

seedGeo()
  .catch((err) => {
    console.error("Geo seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
