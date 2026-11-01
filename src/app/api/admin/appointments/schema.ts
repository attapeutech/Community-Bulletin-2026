import { z } from "zod";
import { APPOINTMENT_TYPE_VALUES } from "@/lib/appointments";

// Optional text: trimmed, "" stored as null
const optText = (max: number) => z.string().trim().max(max).optional().nullable().transform(v => v || null);

export const appointmentSchema = z.object({
  leadId: z.string().uuid("Choose a lead"),
  type: z.enum(APPOINTMENT_TYPE_VALUES),
  startsAt: z.string().datetime({ offset: true, message: "Pick a start time" }),
  endsAt: z.string().datetime({ offset: true, message: "Pick an end time" }),
  place: optText(300),
  notes: optText(2000),
}).refine(a => new Date(a.endsAt) > new Date(a.startsAt), { message: "The end time must be after the start" });
