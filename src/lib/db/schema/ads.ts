import { pgTable, uuid, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { locations } from "./locations";
import { payments } from "./payments";
import { notifications } from "./notifications";

export const adStatusEnum = pgEnum("ad_status", [
  "pending",
  "approved",
  "denied",
  "expired",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "refunded",
  "refund_pending",
  "failed",
]);

export const ads = pgTable("ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),           // Cloudflare R2 CDN URL
  imageKey: text("image_key").notNull(),           // R2 object key for deletion
  status: adStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  reviewNote: text("review_note"),                 // approver's note on deny
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  startedAt: timestamp("started_at").notNull(),    // ad run start date
  endedAt: timestamp("ended_at").notNull(),        // ad run end date (startedAt + 7 days)
  displayOrder: integer("display_order").default(0), // carousel ordering
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adsRelations = relations(ads, ({ one, many }) => ({
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [ads.locationId],
    references: [locations.id],
  }),
  reviewer: one(users, {
    fields: [ads.reviewedBy],
    references: [users.id],
  }),
  payments: many(payments),
  notifications: many(notifications),
}));

export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;
