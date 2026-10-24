import { randomInt } from "node:crypto";
import { db } from "@/lib/db/client";
import { accounts, sessions, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const TEMP_PASSWORD_DAYS = 7;

// Easy to read aloud or write on a card; no look-alike words
const WORDS = [
  "Maple", "Tiger", "River", "Cedar", "Falcon", "Harbor", "Meadow", "Orbit",
  "Pepper", "Quartz", "Robin", "Summit", "Tulip", "Velvet", "Willow", "Amber",
  "Bison", "Canyon", "Dolphin", "Ember", "Forest", "Garnet", "Hazel", "Island",
  "Jasper", "Kettle", "Lemon", "Marble", "Nectar", "Otter", "Pebble", "Raven",
  "Saddle", "Thunder", "Violet", "Walnut", "Badger", "Copper", "Lantern", "Prairie",
];

/** e.g. "Maple-Tiger-River-48" — strong enough for a short-lived, single-use password. */
export function generateTempPassword() {
  const word = () => WORDS[randomInt(WORDS.length)];
  return `${word()}-${word()}-${word()}-${randomInt(10, 100)}`;
}

/**
 * Sets a user's email/password credential (creating it if missing), hashed the same way
 * better-auth hashes sign-up passwords.
 */
export async function setUserPassword(userId: string, password: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);

  const [existing] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1);

  if (existing) {
    await db.update(accounts).set({ password: hash, updatedAt: new Date() }).where(eq(accounts.id, existing.id));
  } else {
    await db.insert(accounts).values({ userId, accountId: userId, providerId: "credential", password: hash });
  }
}

/** Gives the user a fresh temporary password, forces a change on next login, and signs them out everywhere. */
export async function issueTempPassword(userId: string) {
  const password = generateTempPassword();
  await setUserPassword(userId, password);
  await db
    .update(users)
    .set({
      mustChangePassword: true,
      tempPasswordExpiresAt: new Date(Date.now() + TEMP_PASSWORD_DAYS * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  return password;
}
