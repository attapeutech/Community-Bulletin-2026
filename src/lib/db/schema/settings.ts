import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

// Small key → JSON store for admin-editable platform settings
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
