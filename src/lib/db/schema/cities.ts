import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { states } from "./states";
import { postalCodes } from "./postalCodes";
import { locations } from "./locations";

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  stateId: uuid("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const citiesRelations = relations(cities, ({ one, many }) => ({
  state: one(states, {
    fields: [cities.stateId],
    references: [states.id],
  }),
  postalCodes: many(postalCodes),
  locations: many(locations),
}));

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
