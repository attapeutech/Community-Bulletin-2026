// Store traffic (store-reported average customers per day), as shown to advertisers

/** "500", "1,200" */
export function formatShoppers(dailyCustomers: number) {
  return dailyCustomers.toLocaleString("en-US");
}

/** Ad price per 1,000 shopper visits over the week, in cents (null when traffic is unknown) */
export function costPerThousandCents(pricePerWeekCents: number, dailyCustomers: number | null | undefined) {
  if (!dailyCustomers || dailyCustomers <= 0) return null;
  return Math.round((pricePerWeekCents / (dailyCustomers * 7)) * 1000);
}

/** "$28.57" */
export function formatCostPerThousand(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** "Oct 2026" — when the figure was last updated */
export function formatTrafficDate(date: string | Date | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
