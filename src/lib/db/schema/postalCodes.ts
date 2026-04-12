import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { states } from "./states";
import { cities } from "./cities";
import { locations } from "./locations";

export const postalCodes = pgTable("postal_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  stateId: uuid("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "restrict" }),
  cityId: uuid("city_id")
    .notNull()
    .references(() => cities.id, { onDelete: "restrict" }),
  code: text("code").notNull(),   // e.g. "98101", "SW1A 1AA", "M5V 3A8"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postalCodesRelations = relations(postalCodes, ({ one, many }) => ({
  state: one(states, {
    fields: [postalCodes.stateId],
    references: [states.id],
  }),
  city: one(cities, {
    fields: [postalCodes.cityId],
    references: [cities.id],
  }),
  locations: many(locations),
}));

export type PostalCode = typeof postalCodes.$inferSelect;
export type NewPostalCode = typeof postalCodes.$inferInsert;
