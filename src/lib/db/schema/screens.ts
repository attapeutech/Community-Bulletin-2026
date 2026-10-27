import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { locations } from "./locations";

// Browsers running a display screen (store TVs, the all-locations screen). Each saves a random
// device id and checks in about once a minute; admins can assign one to a location remotely.
export const screenDevices = pgTable("screen_devices", {
  id: text("id").primaryKey(),                       // random id saved in the browser
  ip: text("ip"),
  userAgent: text("user_agent"),
  currentPath: text("current_path"),                 // e.g. "/display/all"
  label: text("label"),                              // admin note, e.g. "Fast Eddies TV"
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at"),
  checkins: integer("checkins").default(1).notNull(),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (t) => [index("screen_devices_last_seen_idx").on(t.lastSeenAt)]);

export const screenDevicesRelations = relations(screenDevices, ({ one }) => ({
  location: one(locations, { fields: [screenDevices.locationId], references: [locations.id] }),
}));
