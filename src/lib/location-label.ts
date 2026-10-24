/** "ABC Whole Food Market #101 — 4615 196th St SW, Lynnwood, WA 98036" — used in emails. */
export function formatLocationLabel(loc: {
  storeName: string;
  storeNumber?: string | null;
  addressLine1: string;
  cityName: string;
  stateCode: string;
  postalCode: string;
}) {
  const number = loc.storeNumber?.trim().replace(/^#/, "");
  const name = number ? `${loc.storeName} #${number}` : loc.storeName;
  return `${name} — ${loc.addressLine1}, ${loc.cityName}, ${loc.stateCode} ${loc.postalCode}`;
}
