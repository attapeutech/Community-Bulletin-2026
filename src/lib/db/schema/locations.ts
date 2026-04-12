import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { countries } from "./countries";
import { states } from "./states";
import { cities } from "./cities";
import { postalCodes } from "./postalCodes";
import { ads } from "./ads";

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeOwnerId: uuid("store_owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  countryId: uuid("country_id")
    .notNull()
    .references(() => countries.id, { onDelete: "restrict" }),
  stateId: uuid("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "restrict" }),
  cityId: uuid("city_id")
    .notNull()
    .references(() => cities.id, { onDelete: "restrict" }),
  postalCodeId: uuid("postal_code_id")
    .notNull()
    .references(() => postalCodes.id, { onDelete: "restrict" }),
  storeName: text("store_name").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  slug: text("slug").notNull().unique(),         // e.g. "whole-foods-seattle-98101"
  displayName: text("display_name"),             // friendly name shown on display screen
  currency: text("currency").default("USD").notNull(), // ISO 4217 per location
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const locationsRelations = relations(locations, ({ one, many }) => ({
  storeOwner: one(users, {
    fields: [locations.storeOwnerId],
    references: [users.id],
  }),
  country: one(countries, {
    fields: [locations.countryId],
    references: [countries.id],
  }),
  state: one(states, {
    fields: [locations.stateId],
    references: [states.id],
  }),
  city: one(cities, {
    fields: [locations.cityId],
    references: [cities.id],
  }),
  postalCode: one(postalCodes, {
    fields: [locations.postalCodeId],
    references: [postalCodes.id],
  }),
  ads: many(ads),
}));

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
