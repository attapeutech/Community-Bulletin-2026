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

// "sale": drawn by the screen from templateData. "poster": the advertiser's own flyer, shown full screen
// with only an optional website QR code (no title or contact panel). null: older own-image ads.
export const AD_TEMPLATES = ["sale", "poster"] as const;
export type AdTemplate = (typeof AD_TEMPLATES)[number];

/** Name used for a poster ad when the advertiser leaves the (optional) name blank */
export const POSTER_TITLE = "Poster ad";

/**
 * Poster ads keep only the website (QR code) and an optional store address (for directions) (for the QR code): no description, phone or address, and the
 * website shows whenever one is given. Shared by posting, swaps and demo ad edits.
 */
export function posterFields<T extends {
  title: string; description?: string; contactPhone?: string; contactAddress?: string; contactWebsite?: string;
  showPhone?: boolean; showAddress?: boolean; showWebsite?: boolean;
}>(data: T): T {
  const website = data.contactWebsite?.trim() || undefined;
  return {
    ...data,
    title: data.title.trim() || POSTER_TITLE,
    description: undefined,
    contactPhone: undefined,
    contactAddress: data.contactAddress?.trim() || undefined,  // optional, for "Get directions"
    contactWebsite: website,
    showPhone: false,
    showAddress: !!data.contactAddress?.trim(),
    showWebsite: !!website,
  };
}

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

// ── QR code: what scanning it offers ──
// The screen's QR goes to /go/<id>. With only a website it jumps straight there; with an address
// or phone it opens a small page: See the deal · Get directions · Call (src/app/go/[id]/options).

export type QrOffer = { deal: boolean; directions: boolean; call: boolean };

/** What the ad's QR page can offer, from the contact details the advertiser chose to show */
export function qrOffer(ad: {
  contactWebsite?: string | null; contactAddress?: string | null; contactPhone?: string | null;
  showWebsite?: boolean | null; showAddress?: boolean | null; showPhone?: boolean | null;
}): QrOffer {
  return {
    deal: !!(ad.showWebsite && ad.contactWebsite?.trim()),
    directions: !!(ad.showAddress && ad.contactAddress?.trim()),
    call: !!(ad.showPhone && ad.contactPhone?.trim()),
  };
}

/** Whether the screen shows a QR code at all (a deal link or directions to give) */
export const hasQr = (o: QrOffer) => o.deal || o.directions;

/** Poster ads' smaller corner QR caption, in sentence case */
export function qrCaption(o: QrOffer) {
  if (o.deal && o.directions) return "Scan for deal & directions";
  if (o.directions) return "Scan for directions";
  return "Scan to visit";
}

/** The words under the QR code on the screen */
export function qrLabel(o: QrOffer) {
  if (o.deal && o.directions) return "SCAN FOR DEAL & DIRECTIONS";
  if (o.directions) return "SCAN FOR DIRECTIONS";
  return "SCAN FOR DEAL";
}

/** The advertiser's website as a full URL ("example.com" becomes "https://example.com") */
export function websiteUrl(site: string) {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`;
}

/** Map links: Apple Maps on iPhone / iPad / Mac, Google Maps elsewhere (or when asked for) */
export function mapsUrl(address: string, app: "apple" | "google") {
  const q = encodeURIComponent(address);
  return app === "apple" ? `https://maps.apple.com/?daddr=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
