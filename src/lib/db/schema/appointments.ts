import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { leads } from "./leads";

// Sales calendar: timed appointments with a lead (store visit, call, demo, meeting). Admin-only.
// Follow-up dates stay on the lead (leads.next_follow_up); the calendar shows both.
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  type: text("type").default("visit").notNull(),          // visit | call | demo | meeting
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  place: text("place"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("appointments_starts_idx").on(t.startsAt),
  index("appointments_lead_idx").on(t.leadId),
]);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  lead: one(leads, { fields: [appointments.leadId], references: [leads.id] }),
  creator: one(users, { fields: [appointments.createdBy], references: [users.id] }),
}));
