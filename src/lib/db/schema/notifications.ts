import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { ads } from "./ads";

export const notificationTypeEnum = pgEnum("notification_type", [
  "ad_submitted",
  "ad_approved",
  "ad_denied",
  "ad_expired",
  "payment_received",
  "payment_refunded",
  "ad_cancelled",
  "ad_expiring",        // advertiser: run ends within 24h
  "ad_pending_review",  // approvers/admins: new paid ad to review
  "store_ad_paid",      // store owner: new paid ad at their location
  "earnings_available", // store owner: earnings released after run ended
  "payout_sent",        // store owner: payout recorded
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "socket",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  adId: uuid("ad_id")
    .references(() => ads.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationStatusEnum("status").default("pending").notNull(),
  subject: text("subject"),
  body: text("body"),
  sentAt: timestamp("sent_at"),
  link: text("link"),                 // in-app destination when the bell item is clicked
  readAt: timestamp("read_at"),       // null = unread (in-app "socket" channel only)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notifications_user_created_idx").on(t.userId, t.createdAt),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  ad: one(ads, {
    fields: [notifications.adId],
    references: [ads.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
