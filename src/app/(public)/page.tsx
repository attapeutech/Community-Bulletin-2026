import type { Metadata } from "next";
import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
import LandingPage, { type FeaturedStore } from "@/components/marketing/LandingPage";
import { getPriceRange, formatPrice } from "@/lib/pricing";
import { db } from "@/lib/db/client";
import { locations, cities } from "@/lib/db/schema";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Re-read store prices at most once a minute
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

// The busiest active store that has a store-reported shopper count (shown in the hero)
async function getFeaturedStore(): Promise<FeaturedStore | null> {
  try {
    const [row] = await db
      .select({ name: locations.displayName, storeName: locations.storeName, city: cities.name, dailyCustomers: locations.dailyCustomers })
      .from(locations)
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .where(and(eq(locations.isActive, true), isNotNull(locations.dailyCustomers), gt(locations.dailyCustomers, 0)))
      .orderBy(desc(locations.dailyCustomers))
      .limit(1);
    return row?.dailyCustomers ? { name: row.name || row.storeName, city: row.city, dailyCustomers: row.dailyCustomers } : null;
  } catch (err) {
    console.error("[home] getFeaturedStore failed", err);
    return null;
  }
}

export default async function HomePage() {
  const [range, store] = await Promise.all([getPriceRange(), getFeaturedStore()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <LandingPage
        price={{
          amount: formatPrice(range.minCents),
        }}
        store={store}
      />
    </>
  );
}
