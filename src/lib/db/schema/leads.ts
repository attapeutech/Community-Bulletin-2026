import { pgTable, uuid, text, timestamp, date, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { locations } from "./locations";

export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "contacted",
  "interested",
  "won",
  "lost",
]);

// Sales pipeline, in two steps: sign up stores (kind "store_partner"), then sign up advertisers near each
// store (kind "advertiser", with the target store in locationId). Admin-only for now.
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").default("advertiser").notNull(),   // "store_partner" | "advertiser"
  businessName: text("business_name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  address: text("address"),
  source: text("source"),                                // walk_in | referral | phone | event | other
  stage: leadStageEnum("stage").default("new").notNull(),
  nextFollowUp: date("next_follow_up", { mode: "string" }), // calendar day (Pacific), "YYYY-MM-DD"
  lostReason: text("lost_reason"),
  // Advertiser lead: the store they'd advertise at. Store lead: the location it became once set up.
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
  // Who works the lead, and the customer account it became. Kept so sales credit / commission
  // can be worked out later from that account's payments after wonAt.
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  wonAt: timestamp("won_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("leads_stage_follow_up_idx").on(t.stage, t.nextFollowUp),
  index("leads_owner_idx").on(t.ownerId),
  index("leads_user_idx").on(t.userId),
  index("leads_kind_location_idx").on(t.kind, t.locationId),
]);

// Time-stamped history: notes written by the sales team, plus automatic entries for stage changes
export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("lead_notes_lead_idx").on(t.leadId, t.createdAt),
]);

export const leadsRelations = relations(leads, ({ one, many }) => ({
  owner: one(users, { fields: [leads.ownerId], references: [users.id], relationName: "lead_owner" }),
  user: one(users, { fields: [leads.userId], references: [users.id], relationName: "lead_user" }),
  location: one(locations, { fields: [leads.locationId], references: [locations.id] }),
  notes: many(leadNotes),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, { fields: [leadNotes.leadId], references: [leads.id] }),
  author: one(users, { fields: [leadNotes.authorId], references: [users.id] }),
}));

export type Lead = typeof leads.$inferSelect;
export type LeadNote = typeof leadNotes.$inferSelect;
