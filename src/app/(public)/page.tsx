import type { Metadata } from "next";
import LandingPage from "@/components/marketing/LandingPage";
import { getPriceRange, formatPrice } from "@/lib/pricing";
import { getStoreNetwork, formatCities } from "@/lib/network";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Re-read store prices and the store list at most once a minute
export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Tells search engines the business name, logo and site name
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.png`, description: SITE_DESCRIPTION },
    { "@type": "WebSite", "@id": `${SITE_URL}/#site`, name: SITE_NAME, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#org` } },
  ],
};

export default async function HomePage() {
  const [range, network] = await Promise.all([getPriceRange(), getStoreNetwork()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <LandingPage
        price={{
          amount: formatPrice(range.minCents),
        }}
        network={network}
        citiesLabel={formatCities(network.cities)}
      />
    </>
  );
}
