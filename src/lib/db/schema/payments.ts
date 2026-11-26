import { pgTable, uuid, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { ads } from "./ads";

export const paymentProviderEnum = pgEnum("payment_provider", [
  "stripe",
  "paypal",
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "restrict" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  provider: paymentProviderEnum("provider").notNull(),
  providerTxId: text("provider_tx_id").notNull(),      // Stripe payment_intent id or PayPal order id
  providerRefundId: text("provider_refund_id"),         // populated on refund
  status: text("status").notNull(),                     // stripe/paypal native status
  amountCents: integer("amount_cents").notNull(),       // e.g. 10000 = $100.00
  currency: text("currency").default("USD").notNull(),  // ISO 4217
  feeCents: integer("fee_cents"),                       // processor fee; null until known
  // Sales tax inside amountCents (amountCents is what the customer paid, tax included). The ad price is
  // amountCents - taxCents; store shares and revenue use that. Rate and area are copied from the store at payment.
  taxCents: integer("tax_cents").default(0).notNull(),
  taxRateBps: integer("tax_rate_bps"),
  taxLocationCode: text("tax_location_code"),
  taxAreaName: text("tax_area_name"),
  // Store owner paid outside the system (cash, Zelle, check), e.g. before their store had a store-owner
  // account. Admin-recorded on the Revenue page; counts as the store's share of this ad in CB's numbers.
  offlineStorePaidCents: integer("offline_store_paid_cents"),
  offlineStorePaidMethod: text("offline_store_paid_method"),   // "cash" | "zelle" | "check"
  offlineStorePaidOn: text("offline_store_paid_on"),           // YYYY-MM-DD
  offlineStorePaidNote: text("offline_store_paid_note"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  ad: one(ads, {
    fields: [payments.adId],
    references: [ads.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
