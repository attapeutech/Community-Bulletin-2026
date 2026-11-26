/**
 * Sales tax on ads (Washington taxes advertising as a retail sale since Oct 1, 2025, ESSB 5814).
 * Ads are taxed where they're shown, so each store carries the rate for its own address, looked up from the
 * WA Department of Revenue. The ad price stays as set ($100); tax is added on top at checkout.
 */

/** WA DOR county number (first two digits of a location code), alphabetical as DOR numbers them */
const WA_COUNTIES = [
  "Adams", "Asotin", "Benton", "Chelan", "Clallam", "Clark", "Columbia", "Cowlitz", "Douglas", "Ferry",
  "Franklin", "Garfield", "Grant", "Grays Harbor", "Island", "Jefferson", "King", "Kitsap", "Kittitas", "Klickitat",
  "Lewis", "Lincoln", "Mason", "Okanogan", "Pacific", "Pend Oreille", "Pierce", "San Juan", "Skagit", "Skamania",
  "Snohomish", "Spokane", "Stevens", "Thurston", "Wahkiakum", "Walla Walla", "Whatcom", "Whitman", "Yakima",
];

/** "Snohomish County" from location code "3131"; null when unknown */
export function waCountyName(locationCode: string | null | undefined) {
  const n = Number((locationCode ?? "").slice(0, 2));
  const name = WA_COUNTIES[n - 1];
  return name ? `${name} County` : null;
}

/** Tax on a price, as Stripe works it out per line (rounded to the cent) */
export function taxCentsFor(priceCents: number, rateBps: number | null | undefined) {
  if (!rateBps || rateBps <= 0) return 0;
  return Math.round((priceCents * rateBps) / 10000);
}

/**
 * For price boxes: "+ $10.50 sales tax (10.5%, Everett)" and the total to pay ("$110.50").
 * No tax set up for the store: no note, and the total is the price.
 */
export function taxSummary(priceCents: number, rateBps: number | null | undefined, areaName?: string | null) {
  const taxCents = taxCentsFor(priceCents, rateBps);
  const cents = (c: number) => `$${(c / 100).toFixed(2)}`;
  return {
    taxCents,
    totalCents: priceCents + taxCents,
    totalLabel: taxCents > 0 ? cents(priceCents + taxCents) : null,
    note: taxCents > 0 && rateBps ? `+ ${cents(taxCents)} sales tax (${formatTaxRate(rateBps)}${areaName ? `, ${areaName}` : ""})` : null,
  };
}

/** "10.5%", "9.4%", "8.85%" */
export function formatTaxRate(rateBps: number) {
  return `${(rateBps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

/** "Unincorporated Snohomish County" from DOR's "SNOHOMISH PTBA" / "SNOHOMISH UNINCORP"; "Everett" from "EVERETT" */
function areaNameFromDor(name: string, locationCode: string) {
  const title = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).trim();
  const unincorporated = name.match(/^(.*?)\s+(PTBA|UNINC\w*|UNINCORP\w*|COUNTY)$/i);
  if (unincorporated) {
    const county = waCountyName(locationCode) ?? `${title(unincorporated[1])} County`;
    return `Unincorporated ${county}`;
  }
  return title(name);
}

export type WaTaxRate = {
  rateBps: number;
  locationCode: string;
  areaName: string;
  period: string | null;
};

/**
 * Looks up the sales tax rate for a Washington street address from the Department of Revenue
 * (free, no key: https://webgis.dor.wa.gov/webapi/addressrates.aspx). Returns null when DOR can't place it.
 */
export async function lookupWaTaxRate(addr: { street: string; city: string; zip: string }): Promise<WaTaxRate | null> {
  const qs = new URLSearchParams({ output: "xml", addr: addr.street.trim(), city: addr.city.trim(), zip: addr.zip.trim().slice(0, 5) });
  const res = await fetch(`https://webgis.dor.wa.gov/webapi/addressrates.aspx?${qs}`, {
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`DOR rate lookup failed (${res.status})`);
  const xml = await res.text();

  const attr = (tag: string, name: string) => {
    const el = xml.match(new RegExp(`<${tag}\\b[^>]*>`, "i"))?.[0] ?? "";
    return el.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1] ?? null;
  };
  const code = Number(attr("response", "code"));
  const locationCode = attr("response", "loccode");
  const rate = Number(attr("response", "rate"));
  // Result codes 0-2: found (by address or ZIP); 3+: not found / invalid
  if (!(code >= 0 && code <= 2) || !locationCode || locationCode === "-1" || !(rate > 0)) return null;

  return {
    rateBps: Math.round(rate * 10000),
    locationCode,
    areaName: areaNameFromDor(attr("rate", "name") ?? "", locationCode),
    period: attr("addressline", "period"),
  };
}
