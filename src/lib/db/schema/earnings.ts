import { pgTable, uuid, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { locations } from "./locations";
import { payments } from "./payments";

// pending   → paid by advertiser, ad run not finished yet
// available → run finished, owed to the store owner
// paid      → included in a payout
// void      → payment refunded or removed; nothing owed
export const earningStatusEnum = pgEnum("earning_status", [
  "pending",
  "available",
  "paid",
  "void",
]);

export const payoutMethodEnum = pgEnum("payout_method", [
  "zelle",
  "check",
]);

// One row per advertiser payment at a store-owner location.
// Share rate is snapshotted at payment time so later location changes don't rewrite history.
export const ownerEarnings = pgTable("owner_earnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .unique()
    .references(() => payments.id, { onDelete: "set null" }),  // null if the payment row is deleted
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  adTitle: text("ad_title").notNull(),                      // snapshot for history
  grossCents: integer("gross_cents").notNull(),
  feeCents: integer("fee_cents"),                           // processor fee, known at release
  shareRateBps: integer("share_rate_bps").notNull(),        // 2500 = 25%, 5000 = 50%
  amountCents: integer("amount_cents"),                     // (gross - fee) * rate, set at release
  currency: text("currency").default("USD").notNull(),
  status: earningStatusEnum("status").default("pending").notNull(),
  availableAt: timestamp("available_at"),                   // ad run end; null until approved
  releasedAt: timestamp("released_at"),
  payoutId: uuid("payout_id").references(() => payouts.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("owner_earnings_owner_status_idx").on(t.ownerId, t.status),
]);

// One row per manual payment sent to a store owner.
export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  method: payoutMethodEnum("method").notNull(),
  reference: text("reference"),                             // Zelle confirmation or check number
  note: text("note"),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ownerEarningsRelations = relations(ownerEarnings, ({ one }) => ({
  payment: one(payments, { fields: [ownerEarnings.paymentId], references: [payments.id] }),
  owner: one(users, { fields: [ownerEarnings.ownerId], references: [users.id] }),
  location: one(locations, { fields: [ownerEarnings.locationId], references: [locations.id] }),
  payout: one(payouts, { fields: [ownerEarnings.payoutId], references: [payouts.id] }),
}));

export const payoutsRelations = relations(payouts, ({ one, many }) => ({
  owner: one(users, { fields: [payouts.ownerId], references: [users.id] }),
  earnings: many(ownerEarnings),
}));

export type OwnerEarning = typeof ownerEarnings.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
