import { STORE_CARD_FEE_BPS, STORE_CARD_FEE_FIXED_CENTS } from "@/types";

/**
 * What Community Bulletin keeps from one paid ad (admin only). $100 ad at a 50% store, 9.4% tax:
 *   $50.00  Our 50% of the $100 ad
 * + $9.40   Sales tax collected
 *   $59.40  Subtotal
 * − $1.72   Stripe fee, our part ($3.47 Stripe charged − $1.75 the store's part)
 *   $57.68  After Stripe
 * − $9.40   Sales tax owed to WA
 *   $48.28  CB keeps
 * Stripe charges its 30¢ once per payment and the store's card fee already covers it, so our part has none.
 * Safe in the browser (no server imports).
 */
export function cbEarning(p: {
  adPriceCents: number;        // before tax
  taxCents: number;
  storeShareCents: number;     // 0 for our own stores (we keep the whole ad)
  storeFeeCents: number;       // card fee taken from the store's share (0 for our own stores)
  stripeFeeCents: number | null;  // what Stripe charged for this payment; null = not known yet (estimated)
}) {
  const ourShareCents = p.adPriceCents - p.storeShareCents;
  const subtotalCents = ourShareCents + p.taxCents;
  const estimated = p.stripeFeeCents === null;
  const stripeTotalCents = p.stripeFeeCents
    ?? Math.round(((p.adPriceCents + p.taxCents) * STORE_CARD_FEE_BPS) / 10000) + STORE_CARD_FEE_FIXED_CENTS;
  const ourFeeCents = stripeTotalCents - p.storeFeeCents;
  const afterStripeCents = subtotalCents - ourFeeCents;
  return {
    ourShareCents,
    subtotalCents,
    stripeTotalCents,
    ourFeeCents,
    afterStripeCents,
    keepsCents: afterStripeCents - p.taxCents,
    estimated,
  };
}

export type CbEarning = ReturnType<typeof cbEarning>;
