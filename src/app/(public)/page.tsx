import LandingPage from "@/components/marketing/LandingPage";
import { getPriceRange, formatPrice, priceLabel } from "@/lib/pricing";

// Re-read store prices at most once a minute
export const revalidate = 60;

export default async function HomePage() {
  const range = await getPriceRange();
  return (
    <LandingPage
      price={{
        amount: formatPrice(range.minCents),
        label: priceLabel(range),
        uniform: range.minCents === range.maxCents,
      }}
    />
  );
}
