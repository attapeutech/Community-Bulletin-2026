import LandingPage from "@/components/marketing/LandingPage";
import { getPriceRange, formatPrice } from "@/lib/pricing";

// Re-read store prices at most once a minute
export const revalidate = 60;

export default async function HomePage() {
  const range = await getPriceRange();
  return (
    <LandingPage
      price={{
        amount: formatPrice(range.minCents),
        uniform: range.minCents === range.maxCents,
      }}
    />
  );
}
