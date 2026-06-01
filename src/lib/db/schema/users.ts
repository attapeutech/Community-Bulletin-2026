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
});

export const usersRelations = relations(users, ({ many }) => ({
  ads: many(ads),
  locations: many(locations),
  payments: many(payments),
  notifications: many(notifications),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
