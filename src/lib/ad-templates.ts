import { z } from "zod";

// Built-in ad templates: the screen draws the ad from these fields (ads.template + ads.template_data)
// instead of showing the advertiser's own image. The photo is still ads.image_url.

export const SALE_LIMITS = {
  businessName: 40,
  offerBig: 8,
  offerSmall: 10,
  headline: 40,
  details: 80,
  ends: 20,
} as const;

export const saleTemplateSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(SALE_LIMITS.businessName),
  offerBig: z.string().trim().min(1, "Offer is required").max(SALE_LIMITS.offerBig),
  offerSmall: z.string().trim().max(SALE_LIMITS.offerSmall).default(""),
  headline: z.string().trim().min(2, "Headline is required").max(SALE_LIMITS.headline),
  details: z.string().trim().max(SALE_LIMITS.details).default(""),
  ends: z.string().trim().max(SALE_LIMITS.ends).default(""),
});

export type SaleTemplateData = z.infer<typeof saleTemplateSchema>;

export const AD_TEMPLATES = ["sale"] as const;
export type AdTemplate = (typeof AD_TEMPLATES)[number];

export const EMPTY_SALE: SaleTemplateData = { businessName: "", offerBig: "", offerSmall: "", headline: "", details: "", ends: "" };

/** Title used everywhere outside the screen (My Ads, review, emails): "20% OFF any large pizza" */
export function saleTitle(d: SaleTemplateData) {
  return [d.offerBig, d.offerSmall, d.headline].filter(Boolean).join(" ").trim();
}

/** Read stored template data defensively (old or partial rows render with blanks) */
export function readSaleData(raw: unknown): SaleTemplateData {
  const r = (raw ?? {}) as Partial<Record<keyof SaleTemplateData, unknown>>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    businessName: str(r.businessName), offerBig: str(r.offerBig), offerSmall: str(r.offerSmall),
    headline: str(r.headline), details: str(r.details), ends: str(r.ends),
  };
}
