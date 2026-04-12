import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
