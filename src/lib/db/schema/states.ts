import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { countries } from "./countries";
import { cities } from "./cities";
import { postalCodes } from "./postalCodes";
import { locations } from "./locations";

export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryId: uuid("country_id")
    .notNull()
    .references(() => countries.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  code: text("code").notNull(),   // e.g. "WA", "CA", "ON", "ENG"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const statesRelations = relations(states, ({ one, many }) => ({
  country: one(countries, {
    fields: [states.countryId],
    references: [countries.id],
  }),
  cities: many(cities),
  postalCodes: many(postalCodes),
  locations: many(locations),
}));

export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;
