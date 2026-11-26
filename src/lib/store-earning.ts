import { STORE_CARD_FEE_BPS, STORE_CARD_FEE_FIXED_CENTS } from "@/types";

/**
 * What a store owner earns from one ad: their share of the ad price (before sales tax), less the card fee
 * of 2.9% of that share + 30¢.  $100 ad at 50%: $50.00 − ($1.45 + $0.30) = $48.25.
 * Safe in the browser (no server imports): the Earnings page and /demo show the same numbers.
 */
export function storeEarning(adPriceCents: number, shareRateBps: number) {
  const shareCents = Math.round((adPriceCents * shareRateBps) / 10000);
  if (shareCents <= 0) return { shareCents: 0, percentFeeCents: 0, fixedFeeCents: 0, feeCents: 0, netCents: 0 };
  const percentFeeCents = Math.round((shareCents * STORE_CARD_FEE_BPS) / 10000);
  const fixedFeeCents = Math.min(STORE_CARD_FEE_FIXED_CENTS, shareCents - percentFeeCents);
  const feeCents = percentFeeCents + fixedFeeCents;
  return { shareCents, percentFeeCents, fixedFeeCents, feeCents, netCents: shareCents - feeCents };
}

export type StoreEarning = ReturnType<typeof storeEarning>;

/** "2.9%" */
export const STORE_CARD_FEE_LABEL = `${STORE_CARD_FEE_BPS / 100}%`;
