import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import {
  countries, states, cities, postalCodes, users,
} from "../src/lib/db/schema";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding database...");

  console.log("  → Countries");
  const [us] = await db.insert(countries).values({
    name: "United States", code: "US",
    phoneCode: "+1", currencyCode: "USD", currencySymbol: "$",
  }).onConflictDoNothing().returning();

  const existing = await db.select().from(countries).where(eq(countries.code, "US")).limit(1);
  const usId = us?.id ?? existing[0]?.id;
  if (!usId) { console.log("❌ No country ID"); process.exit(1); }

  console.log("  → States");
  await db.insert(states).values([
    { name: "Washington", code: "WA", countryId: usId },
    { name: "California", code: "CA", countryId: usId },
    { name: "New York", code: "NY", countryId: usId },
    { name: "Texas", code: "TX", countryId: usId },
    { name: "Florida", code: "FL", countryId: usId },
    { name: "Illinois", code: "IL", countryId: usId },
    { name: "Oregon", code: "OR", countryId: usId },
    { name: "Colorado", code: "CO", countryId: usId },
  ]).onConflictDoNothing();

  const wa = await db.select().from(states).where(eq(states.code, "WA")).limit(1);
  const waId = wa[0]?.id;
  if (!waId) { console.log("❌ No WA ID"); process.exit(1); }

  console.log("  → Cities");
  await db.insert(cities).values([
    { stateId: waId, name: "Seattle" },
    { stateId: waId, name: "Bellevue" },
    { stateId: waId, name: "Tacoma" },
    { stateId: waId, name: "Spokane" },
    { stateId: waId, name: "Redmond" },
    { stateId: waId, name: "Kirkland" },
  ]).onConflictDoNothing();

  const seattle = await db.select().from(cities).where(eq(cities.name, "Seattle")).limit(1);
  const seattleId = seattle[0]?.id;
  if (!seattleId) { console.log("❌ No Seattle ID"); process.exit(1); }

  console.log("  → Postal codes");
  await db.insert(postalCodes).values([
    { stateId: waId, cityId: seattleId, code: "98101" },
    { stateId: waId, cityId: seattleId, code: "98102" },
    { stateId: waId, cityId: seattleId, code: "98103" },
    { stateId: waId, cityId: seattleId, code: "98104" },
    { stateId: waId, cityId: seattleId, code: "98105" },
    { stateId: waId, cityId: seattleId, code: "98109" },
    { stateId: waId, cityId: seattleId, code: "98115" },
    { stateId: waId, cityId: seattleId, code: "98121" },
  ]).onConflictDoNothing();

  console.log("  → Admin user");
  await db.insert(users).values({
    name: "Platform Admin",
    email: "admin@communitybulletin.com",
    emailVerified: true,
    passwordHash: await hash("Admin@123!", 12),
    role: "admin",
  }).onConflictDoNothing();

  console.log("  → Approver user");
  await db.insert(users).values({
    name: "Ad Approver",
    email: "approver@communitybulletin.com",
    emailVerified: true,
    passwordHash: await hash("Approver@123!", 12),
    role: "approver",
  }).onConflictDoNothing();

  console.log("\n✅ Seed complete!");
  console.log("   Admin:    admin@communitybulletin.com / Admin@123!");
  console.log("   Approver: approver@communitybulletin.com / Approver@123!");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});