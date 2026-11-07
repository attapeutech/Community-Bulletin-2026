import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { equipment } from "./equipment";
import { users } from "./users";

// Photos of an equipment item (snapped on site). Stored in R2 under files/equipment/<item id>/,
// a ~1600 px version and a ~400 px thumbnail. Never shown via the public R2 URL: admins get a
// short-lived signed link from /api/admin/equipment/photos/<id> (router photos can show WiFi passwords).
export const equipmentPhotos = pgTable("equipment_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  thumbKey: text("thumb_key").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("equipment_photos_equipment_idx").on(t.equipmentId)]);

export const equipmentPhotosRelations = relations(equipmentPhotos, ({ one }) => ({
  equipment: one(equipment, { fields: [equipmentPhotos.equipmentId], references: [equipment.id] }),
}));
