import { db } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { AD_PRICE_CENTS } from "@/types";

export type PriceRange = { minCents: number; maxCents: number };

/** Lowest and highest weekly price across active store locations (falls back to the default price). */
export async function getPriceRange(): Promise<PriceRange> {
  try {
    const [row] = await db
      .select({
        minCents: sql<number | null>`min(${locations.pricePerWeekCents})::int`,
        maxCents: sql<number | null>`max(${locations.pricePerWeekCents})::int`,
      })
      .from(locations)
      .where(eq(locations.isActive, true));
    return {
      minCents: row?.minCents ?? AD_PRICE_CENTS,
      maxCents: row?.maxCents ?? AD_PRICE_CENTS,
    };
  } catch (err) {
    console.error("[pricing] getPriceRange failed", err);
    return { minCents: AD_PRICE_CENTS, maxCents: AD_PRICE_CENTS };
  }
}

/** "$100" for whole dollars, "$99.50" otherwise. */
export function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
