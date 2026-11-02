import type { SaleTemplateData } from "@/lib/ad-templates";

// Content for our own slides (home page slideshow and the house slides on store screens)

// An example ad in the Sale template; always shown with a clear "sample" label
export const SAMPLE_SALE_AD: SaleTemplateData = {
  businessName: "Your Pizza Place",
  offerBig: "20%",
  offerSmall: "OFF",
  headline: "Any large pizza",
  details: "Show this screen at the counter. Dine-in or takeout.",
  ends: "Ends Sunday",
};

// Our sister sites, with the figures shown on ADSEZ.com. These are online, worldwide numbers:
// show them only where the disclaimer can be read (the website), never on store screens.
export const ADSEZ_FAMILY = [
  { name: "AdsAndClassifieds.com", href: "https://adsandclassifieds.com", what: "Local classifieds", stats: [["75k+", "users"], ["89k+", "listings"]] },
  { name: "Blog-Directory.org", href: "https://blog-directory.org", what: "Blog directory", stats: [["83k+", "users"], ["142k+", "blogs"]] },
] as const;

// Stand-in "photo" for the sample ad: a pizza on the template's navy, drawn as an SVG
export const SAMPLE_SALE_PHOTO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#2A5A8A"/><stop offset="1" stop-color="#13304F"/></radialGradient></defs><rect width="800" height="800" fill="url(#g)"/><text x="400" y="420" font-size="340" text-anchor="middle" dominant-baseline="middle">🍕</text></svg>`
)}`;
