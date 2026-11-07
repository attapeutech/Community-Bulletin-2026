import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { locations } from "./locations";
import { users } from "./users";

// Per-store setup details for admins: WiFi and the install checklist. One row per location,
// created the first time something is saved. The WiFi password is encrypted (src/lib/secret-box.ts)
// and is only decrypted when an admin clicks "Show".
export const locationSetup = pgTable("location_setup", {
  locationId: uuid("location_id")
    .primaryKey()
    .references(() => locations.id, { onDelete: "cascade" }),
  wifiName: text("wifi_name"),
  wifiPasswordEnc: text("wifi_password_enc"),       // "v1:<iv>:<tag>:<data>" (base64), never sent to the browser
  contactName: text("contact_name"),                // store person who can reset the router / let us in
  contactPhone: text("contact_phone"),
  networkNotes: text("network_notes"),              // e.g. "router in back office, guest network blocks devices"
  // Checklist step -> date it was ticked (YYYY-MM-DD); steps live in src/lib/location-setup.ts
  checklist: jsonb("checklist").$type<Record<string, string>>().default({}).notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const locationSetupRelations = relations(locationSetup, ({ one }) => ({
  location: one(locations, { fields: [locationSetup.locationId], references: [locations.id] }),
}));
