import { db } from "../src/lib/db/client";
import {
  countries,
  states,
  cities,
  postalCodes,
  users,
} from "../src/lib/db/schema";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Countries ───────────────────────────────────────────
  console.log("  → Countries");
  const [us] = await db
    .insert(countries)
    .values({
      name: "United States",
      code: "US",
      phoneCode: "+1",
      currencyCode: "USD",
      currencySymbol: "$",
    })
    .onConflictDoNothing()
    .returning();

  const countryId = us?.id;
  if (!countryId) {
    console.log("  ✓ Countries already seeded, skipping.");
  }

  // ─── States (sample — extend with full US list) ──────────
  console.log("  → States");
  const stateData = [
    { name: "Washington", code: "WA" },
    { name: "California", code: "CA" },
    { name: "New York", code: "NY" },
    { name: "Texas", code: "TX" },
    { name: "Florida", code: "FL" },
    { name: "Illinois", code: "IL" },
    { name: "Oregon", code: "OR" },
    { name: "Colorado", code: "CO" },
  ];

  const [waState] = await db
    .insert(states)
    .values(
      stateData.map((s) => ({
        ...s,
        countryId: countryId ?? "",
      }))
    )
    .onConflictDoNothing()
    .returning();

  // ─── Cities (sample for WA) ──────────────────────────────
  console.log("  → Cities");
  const waId = waState?.id;
  const cityData = waId
    ? [
        { stateId: waId, name: "Seattle" },
        { stateId: waId, name: "Bellevue" },
        { stateId: waId, name: "Tacoma" },
        { stateId: waId, name: "Spokane" },
        { stateId: waId, name: "Bothell" },
        { stateId: waId, name: "Redmond" },
        { stateId: waId, name: "Kirkland" },
      ]
    : [];

  const [seattleCity] = await db
    .insert(cities)
    .values(cityData)
    .onConflictDoNothing()
    .returning();

  // ─── Postal codes (sample for Seattle) ───────────────────
  console.log("  → Postal codes");
  const seattleId = seattleCity?.id;
  const postalData = seattleId && waId
    ? [
        { stateId: waId, cityId: seattleId, code: "98101" },
        { stateId: waId, cityId: seattleId, code: "98102" },
        { stateId: waId, cityId: seattleId, code: "98103" },
        { stateId: waId, cityId: seattleId, code: "98104" },
        { stateId: waId, cityId: seattleId, code: "98105" },
        { stateId: waId, cityId: seattleId, code: "98109" },
        { stateId: waId, cityId: seattleId, code: "98115" },
        { stateId: waId, cityId: seattleId, code: "98121" },
      ]
    : [];

  await db.insert(postalCodes).values(postalData).onConflictDoNothing();

  // ─── Seed admin user ─────────────────────────────────────
  console.log("  → Admin user");
  const passwordHash = await hash("Admin@123!", 12);
  await db
    .insert(users)
    .values({
      name: "Platform Admin",
      email: "admin@adboard.com",
      emailVerified: true,
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing();

  // ─── Seed approver user ──────────────────────────────────
  console.log("  → Approver user");
  const approverHash = await hash("Approver@123!", 12);
  await db
    .insert(users)
    .values({
      name: "Ad Approver",
      email: "approver@adboard.com",
      emailVerified: true,
      passwordHash: approverHash,
      role: "approver",
    })
    .onConflictDoNothing();

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
