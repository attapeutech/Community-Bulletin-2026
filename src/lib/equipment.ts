import { z } from "zod";

export const EQUIPMENT_TYPES = [
  { value: "mini_pc", label: "Mini computer" },
  { value: "tv",      label: "TV" },
  { value: "hdmi",    label: "HDMI cable" },
  { value: "mount",   label: "TV mount" },
  { value: "router",  label: "Router / WiFi" },
  { value: "power",   label: "Power strip / cable" },
  { value: "other",   label: "Other" },
] as const;

export const EQUIPMENT_STATUSES = [
  { value: "in_stock",  label: "In stock" },
  { value: "installed", label: "Installed" },
  { value: "repair",    label: "Needs repair" },
  { value: "retired",   label: "Retired" },
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]["value"];
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number]["value"];

export const typeLabel = (v: string) => EQUIPMENT_TYPES.find((t) => t.value === v)?.label ?? v;
export const statusLabel = (v: string) => EQUIPMENT_STATUSES.find((s) => s.value === v)?.label ?? v;

const optText = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

// Shared by create (POST) and edit (PATCH)
export const equipmentSchema = z.object({
  type: z.enum(EQUIPMENT_TYPES.map((t) => t.value) as [EquipmentType, ...EquipmentType[]]),
  status: z.enum(EQUIPMENT_STATUSES.map((s) => s.value) as [EquipmentStatus, ...EquipmentStatus[]]),
  locationId: z.string().uuid().nullable().optional().transform((v) => v ?? null),
  label: optText(120),
  brand: optText(80),
  model: optText(80),
  serialNumber: optText(120),
  screenDeviceId: optText(100),
  purchasedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal("")).transform((v) => v || null),
  costCents: z.number().int().min(0).max(100_000_00).nullable().optional().transform((v) => v ?? null),
  notes: optText(2000),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;
