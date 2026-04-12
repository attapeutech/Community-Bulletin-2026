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
