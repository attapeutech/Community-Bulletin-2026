import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { locations } from "./locations";

export const partnerApplicationStatusEnum = pgEnum("partner_application_status", [
  "pending",
  "approved",
  "declined",
]);

// "I own a store and want to host a screen" — reviewed by an admin before the user becomes a store owner.
// The address is free text: the applicant's city/ZIP may not exist in the admin-managed geo tables yet;
// the admin picks those when setting up the location after approval.
export const partnerApplications = pgTable("partner_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  storeType: text("store_type").notNull(),        // gas_station | convenience | grocery | restaurant | other
  addressLine1: text("address_line1").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  locationsCount: text("locations_count").notNull(), // "1" | "2-5" | "6+"
  hasScreen: text("has_screen").notNull(),           // yes | no | not_sure
  notes: text("notes"),
  status: partnerApplicationStatusEnum("status").default("pending").notNull(),
  declineReason: text("decline_reason"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }), // set when the admin creates the store
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("partner_applications_status_idx").on(t.status, t.createdAt),
  index("partner_applications_user_idx").on(t.userId),
]);

export const partnerApplicationsRelations = relations(partnerApplications, ({ one }) => ({
  user: one(users, { fields: [partnerApplications.userId], references: [users.id] }),
  location: one(locations, { fields: [partnerApplications.locationId], references: [locations.id] }),
}));

export type PartnerApplication = typeof partnerApplications.$inferSelect;
