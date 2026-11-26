import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
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
  storeNumber: text("store_number"),               // e.g. "Store #42", "Unit 5B"
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  slug: text("slug").notNull().unique(),         // e.g. "whole-foods-seattle-98101"
  displayName: text("display_name"),             // friendly name shown on display screen
  currency: text("currency").default("USD").notNull(), // ISO 4217 per location
  pricePerRunCents: integer("price_per_week_cents").default(10000).notNull(), // default $100 per 4-week run (column name predates 4-week pricing)
  equipmentProvided: boolean("equipment_provided").default(false).notNull(),   // store owner supplied the screen (informational)
  shareRateBps: integer("share_rate_bps").default(5000).notNull(),            // owner revenue share, 5000 = 50%; admin-set
  // Sales tax on ads, from the WA Department of Revenue rate lookup for the store's address (ads are taxed
  // where they're shown). Null rate = no tax set up for this store yet (checkout charges no tax).
  taxRateBps: integer("tax_rate_bps"),               // 1050 = 10.5%
  taxLocationCode: text("tax_location_code"),        // DOR location code, e.g. "3131" (used on the tax return)
  taxAreaName: text("tax_area_name"),                // e.g. "Unincorporated Snohomish County", "Everett"
  taxRatePeriod: text("tax_rate_period"),            // DOR quarter the rate is for, e.g. "Q42026"
  taxRateCheckedAt: timestamp("tax_rate_checked_at"),
  description: text("description"),
  category: text("category"),
  logoUrl: text("logo_url"),
  businessHours: text("business_hours"),
  dailyCustomers: integer("daily_customers"),         // store-reported average customers per day; admin-set
  trafficUpdatedAt: timestamp("traffic_updated_at"),  // when dailyCustomers was last set
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
