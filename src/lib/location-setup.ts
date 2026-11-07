import { z } from "zod";

// Install checklist for a store, in order
export const SETUP_STEPS = [
  { key: "delivered", label: "Equipment delivered" },
  { key: "mounted",   label: "TV mounted" },
  { key: "mini_pc",   label: "Mini computer set up" },
  { key: "wifi",      label: "Connected to WiFi" },
  { key: "paired",    label: "Screen paired (Screens page)" },
  { key: "first_ad",  label: "First ad showing" },
] as const;

export type SetupStepKey = (typeof SETUP_STEPS)[number]["key"];
const stepKeys = SETUP_STEPS.map((s) => s.key) as [SetupStepKey, ...SetupStepKey[]];

const optText = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v === undefined ? undefined : v || null));

// PATCH body: only the fields sent are changed.
// wifiPassword: a string sets it, null clears it, left out keeps it.
export const locationSetupSchema = z.object({
  wifiName: optText(100),
  wifiPassword: z.string().max(200).nullable().optional(),
  contactName: optText(100),
  contactPhone: optText(40),
  networkNotes: optText(1000),
  checklist: z.record(z.enum(stepKeys), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export type LocationSetupInput = z.infer<typeof locationSetupSchema>;
