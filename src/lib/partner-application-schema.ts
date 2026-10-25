import { z } from "zod";

// Store partner application fields — shared by the register form, /partners/apply and the API

export const STORE_TYPES = [
  { value: "gas_station", label: "Gas station" },
  { value: "convenience", label: "Convenience store" },
  { value: "grocery", label: "Grocery" },
  { value: "restaurant", label: "Restaurant / Café" },
  { value: "other", label: "Other" },
] as const;

export const LOCATION_COUNTS = [
  { value: "1", label: "1 store" },
  { value: "2-5", label: "2–5 stores" },
  { value: "6+", label: "6+ stores" },
] as const;

export const HAS_SCREEN = [
  { value: "yes", label: "Yes, I have a TV to use" },
  { value: "no", label: "No — please provide one" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map(o => o.value) as [T[number]["value"], ...T[number]["value"][]];

export const partnerApplicationSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your store or business name").max(120),
  contactName: z.string().trim().min(2, "Enter a contact name").max(120),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  storeType: z.enum(values(STORE_TYPES), { errorMap: () => ({ message: "Choose a store type" }) }),
  addressLine1: z.string().trim().min(5, "Enter the street address").max(200),
  city: z.string().trim().min(2, "Enter the city").max(100),
  state: z.string().trim().min(2, "Enter the state").max(50),
  postalCode: z.string().trim().min(3, "Enter the ZIP code").max(12),
  locationsCount: z.enum(values(LOCATION_COUNTS), { errorMap: () => ({ message: "Choose how many stores" }) }),
  hasScreen: z.enum(values(HAS_SCREEN), { errorMap: () => ({ message: "Choose an option" }) }),
  notes: z.string().trim().max(1000).optional(),
});

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;

export const labelFor = (list: readonly { value: string; label: string }[], value: string) =>
  list.find(o => o.value === value)?.label ?? value;
