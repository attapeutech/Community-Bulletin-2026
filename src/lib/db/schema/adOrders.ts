import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

// One order = one checkout for the same ad at several stores. Each store still gets its own ad row
// (ads.order_id), with its own payment row, review, screen, counts and store earnings, exactly like a
// single-store ad; one Stripe checkout has a line per store, and each payment row is that store's
// line amount (refunds and Stripe fees are split per row, see lib/refund.ts and lib/earnings.ts).
export const adOrders = pgTable("ad_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("ad_orders_user_idx").on(t.userId)]);
