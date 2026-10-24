import { pgTable, uuid, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { ads } from "./ads";

// Ads a signed-in user has hearted (their wishlist). One row per user per ad.
export const savedAds = pgTable("saved_ads", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  adId: uuid("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.adId] }),
  index("saved_ads_ad_idx").on(t.adId),   // per-ad save counts for advertisers
]);

export const savedAdsRelations = relations(savedAds, ({ one }) => ({
  user: one(users, { fields: [savedAds.userId], references: [users.id] }),
  ad: one(ads, { fields: [savedAds.adId], references: [ads.id] }),
}));

export type SavedAd = typeof savedAds.$inferSelect;
