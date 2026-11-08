import { pgTable, uuid, text, integer, date, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { locations } from "./locations";
import { screenDevices } from "./screens";

// Hardware we own or track per store: mini computers, TVs, HDMI cables, mounts, routers...
// No location = in stock. A mini computer can be linked to the screen device (browser id) it runs,
// so the equipment list can show whether that screen is online.
// type and status are plain text; the allowed values live in src/lib/equipment.ts.
export const equipment = pgTable("equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
  type: text("type").notNull(),                     // mini_pc | tv | hdmi | mount | router | power | other
  status: text("status").default("in_stock").notNull(), // in_stock | installed | repair | retired
  label: text("label"),                             // e.g. "TV behind the register"
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  screenDeviceId: text("screen_device_id").references(() => screenDevices.id, { onDelete: "set null" }),
  purchasedOn: date("purchased_on"),
  costCents: integer("cost_cents"),
  notes: text("notes"),
  // Remote access (mini computers, Chrome Remote Desktop). The *_enc columns are encrypted with
  // src/lib/secret-box.ts and only decrypted when an admin clicks "Show"; never sent with the page.
  remoteAccount: text("remote_account"),            // Google account the computer is signed in with
  remoteAccountPasswordEnc: text("remote_account_password_enc"),
  remoteUrl: text("remote_url"),                    // e.g. https://remotedesktop.google.com/access
  remoteComputerName: text("remote_computer_name"), // name shown in Chrome Remote Desktop
  remotePinEnc: text("remote_pin_enc"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("equipment_location_idx").on(t.locationId)]);

export const equipmentRelations = relations(equipment, ({ one }) => ({
  location: one(locations, { fields: [equipment.locationId], references: [locations.id] }),
  screenDevice: one(screenDevices, { fields: [equipment.screenDeviceId], references: [screenDevices.id] }),
}));
