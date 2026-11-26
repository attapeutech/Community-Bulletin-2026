import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

// ── Stripe ──────────────────────────────────────────────────────────────────────────────────────────

/** The store's tax for Stripe Checkout */
export type StoreTax = { taxRateBps: number | null; taxLocationCode: string | null; taxAreaName: string | null };

const taxRateIds = new Map<string, string>();

/**
 * The Stripe tax rate to put on a checkout line for this store (null: no tax set up for the store).
 * Found by its area code and rate, or made the first time, in whichever Stripe mode the keys are for
 * (test and live each have their own), so nothing Stripe-specific is saved on the store.
 */
export async function stripeTaxRateIds(store: StoreTax): Promise<string[] | undefined> {
  if (!store.taxRateBps || store.taxRateBps <= 0) return undefined;
  const key = `WA:${store.taxLocationCode ?? "-"}:${store.taxRateBps}`;
  const cached = taxRateIds.get(key);
  if (cached) return [cached];

  let found: Stripe.TaxRate | undefined;
  for await (const r of stripe.taxRates.list({ active: true, limit: 100 })) {
    if (r.metadata?.cb_key === key && !r.inclusive) { found = r; break; }
  }
  if (!found) {
    const area = store.taxAreaName ?? "Washington";
    found = await stripe.taxRates.create({
      display_name: "Sales tax",
      description: `WA sales tax · ${area}${store.taxLocationCode ? ` (location code ${store.taxLocationCode})` : ""}`,
      jurisdiction: `WA · ${area}`.slice(0, 50),
      percentage: store.taxRateBps / 100,
      inclusive: false,
      country: "US",
      state: "WA",
      tax_type: "sales_tax",
      metadata: { cb_key: key, location_code: store.taxLocationCode ?? "" },
    });
  }
  taxRateIds.set(key, found.id);
  return [found.id];
}
