// Ad swaps: replace a running paid ad with a new version (same business), reviewed, no new payment
import { z } from "zod";
import { saleTemplateSchema, saleTitle } from "@/lib/ad-templates";

/** The ad content an advertiser sends as the new version (the store, dates and payment stay) */
export const swapContentSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  imageKey: z.string().min(1),
  contactPhone:   z.string().max(30).optional(),
  contactAddress: z.string().max(200).optional(),
  contactWebsite: z.string().max(200).optional(),
  showPhone:   z.boolean().optional(),
  showAddress: z.boolean().optional(),
  showWebsite: z.boolean().optional(),
  template: z.literal("sale").optional(),
  templateData: z.unknown().optional(),
});

/** Checks the template fields and returns the columns to store, or an error message */
export function swapColumns(data: z.infer<typeof swapContentSchema>) {
  let { title, description } = data;
  let templateData = null;
  if (data.template === "sale") {
    const parsed = saleTemplateSchema.safeParse(data.templateData);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Template details are incomplete" } as const;
    templateData = parsed.data;
    title = saleTitle(templateData).slice(0, 120);
    description = templateData.details || undefined;
  }
  return {
    columns: {
      title,
      description: description ?? null,
      imageUrl: data.imageUrl,
      imageKey: data.imageKey,
      contactPhone:   data.contactPhone   ?? null,
      contactAddress: data.contactAddress ?? null,
      contactWebsite: data.contactWebsite ?? null,
      showPhone:   data.showPhone   ?? false,
      showAddress: data.showAddress ?? false,
      showWebsite: data.showWebsite ?? false,
      template: data.template ?? null,
      templateData,
    },
  } as const;
}

/** A paid, approved, real ad that hasn't ended can be swapped */
export function canSwap(ad: { status: string; paymentStatus: string; isTest: boolean; demoId: string | null; endedAt: Date | string }, now = new Date()) {
  return ad.status === "approved" && ad.paymentStatus === "paid" && !ad.isTest && !ad.demoId && new Date(ad.endedAt) > now;
}
