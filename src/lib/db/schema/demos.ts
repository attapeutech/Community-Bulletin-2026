import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { locations } from "./locations";
import { leads } from "./leads";
import { ads } from "./ads";

// Sales demos: demo ads made for an advertiser lead, shown to them on their store's real screen design
// (mixed with its live ads) at /display/<store>?demo=<token>. Admin-only. Its ads are test ads
// (isTest, unpaid) with demoId set, so no store screen, preview or report ever includes them.
export const demos = pgTable("demos", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  // The lead's store when the demo was made
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),            // unguessable, in the private link
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at").notNull(),       // the link stops working after this
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("demos_lead_idx").on(t.leadId),
]);

export const demosRelations = relations(demos, ({ one, many }) => ({
  lead: one(leads, { fields: [demos.leadId], references: [leads.id] }),
  location: one(locations, { fields: [demos.locationId], references: [locations.id] }),
  creator: one(users, { fields: [demos.createdBy], references: [users.id] }),
  ads: many(ads),
}));
