import { pgTable, uuid, text, char, timestamp } from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: char("code", { length: 2 }).notNull().unique(),       // ISO 3166-1 e.g. "US"
  phoneCode: text("phone_code"),                               // e.g. "+1"
  currencyCode: char("currency_code", { length: 3 }),          // ISO 4217 e.g. "USD"
  currencySymbol: text("currency_symbol"),                     // e.g. "$"
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;
