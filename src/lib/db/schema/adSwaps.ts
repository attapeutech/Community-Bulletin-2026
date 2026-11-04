import { pgTable, uuid, text, timestamp, boolean, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./users";
import { ads } from "./ads";

export const adSwapStatusEnum = pgEnum("ad_swap_status", ["pending", "approved", "denied", "withdrawn"]);

// Ad swaps: while a paid ad is running, the advertiser can send a new version of it (same business,
// e.g. the next car for sale) for review without paying again. The current version keeps running;
// approving copies the new content onto the same ad, so its payment, earnings, end date, QR link and
// counts stay. At most one swap per ad waits for review.
export const adSwaps = pgTable("ad_swaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  adId: uuid("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: adSwapStatusEnum("status").default("pending").notNull(),
  // The new version (same fields as on ads)
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  imageKey: text("image_key").notNull(),
  contactPhone:   text("contact_phone"),
  contactAddress: text("contact_address"),
  contactWebsite: text("contact_website"),
  showPhone:   boolean("show_phone").default(false).notNull(),
  showAddress: boolean("show_address").default(false).notNull(),
  showWebsite: boolean("show_website").default(false).notNull(),
  template: text("template"),
  templateData: jsonb("template_data"),
  reviewNote: text("review_note"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ad_swaps_ad_idx").on(t.adId, t.createdAt),
  uniqueIndex("ad_swaps_one_pending_idx").on(t.adId).where(sql`${t.status} = 'pending'`),
]);

export const adSwapsRelations = relations(adSwaps, ({ one }) => ({
  ad: one(ads, { fields: [adSwaps.adId], references: [ads.id] }),
  user: one(users, { fields: [adSwaps.userId], references: [users.id] }),
}));
