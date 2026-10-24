import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { ads } from "./ads";
import { locations } from "./locations";
import { payments } from "./payments";
import { notifications } from "./notifications";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "store_owner",
  "approver",
  "admin",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").default("user").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  lastLogoutAt: timestamp("last_logout_at"),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  // Default contact info pre-filled on new ad submissions
  defaultPhone:   text("default_phone"),
  defaultAddress: text("default_address"),
  defaultWebsite: text("default_website"),
  // Store owner payout details (Phase 1: manual Zelle or check, no bank numbers stored)
  payoutMethod:         text("payout_method"),           // "zelle" | "check"
  payoutZelle:          text("payout_zelle"),            // Zelle email or phone
  payoutMailingAddress: text("payout_mailing_address"),  // for checks
  // Admin-created accounts / admin password resets: user must choose their own password on first login
  mustChangePassword:    boolean("must_change_password").default(false).notNull(),
  tempPasswordExpiresAt: timestamp("temp_password_expires_at"),
});

export const usersRelations = relations(users, ({ many }) => ({
  ads: many(ads),
  locations: many(locations),
  payments: many(payments),
  notifications: many(notifications),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
