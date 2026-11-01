import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { leads } from "./leads";
import { demos } from "./demos";
import { ads } from "./ads";

// Sales proposals: a demo ad emailed to an advertiser lead with a private link (/p/<token>), where they
// can accept and pay. Accepting copies the demo ad into a real ad in their account; paying puts it live
// (no review: the sales team built it). Open while the demo's link is (demos.expires_at).
export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  demoId: uuid("demo_id")
    .notNull()
    .references(() => demos.id, { onDelete: "cascade" }),
  demoAdId: uuid("demo_ad_id").references(() => ads.id, { onDelete: "set null" }),  // the demo ad offered
  token: text("token").notNull().unique(),
  email: text("email").notNull(),            // sent to
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),      // first open of the link
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),   // the advertiser's account
  adId: uuid("ad_id").references(() => ads.id, { onDelete: "set null" }),          // their real ad
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("proposals_lead_idx").on(t.leadId),
  index("proposals_ad_idx").on(t.adId),
]);

export const proposalsRelations = relations(proposals, ({ one }) => ({
  lead: one(leads, { fields: [proposals.leadId], references: [leads.id] }),
  demo: one(demos, { fields: [proposals.demoId], references: [demos.id] }),
}));
