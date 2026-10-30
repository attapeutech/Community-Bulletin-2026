import type { MetadataRoute } from "next";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";

// Rebuilt at most once an hour
export const revalidate = 3600;

// /sitemap.xml — public pages, every active store's page and every ad running now
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/live-ads`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/demo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const stores = await db
    .select({ slug: locations.slug, updatedAt: locations.updatedAt })
    .from(locations)
    .where(eq(locations.isActive, true))
    .catch(() => []);

  const liveAds = await db
    .select({ id: ads.id, updatedAt: ads.updatedAt })
    .from(ads)
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .where(and(
      eq(ads.status, "approved"),
      eq(ads.paymentStatus, "paid"),
      eq(ads.isTest, false),
      lte(ads.startedAt, now),
      gte(ads.endedAt, now),
      eq(locations.isActive, true),
    ))
    .catch(() => []);

  return [
    ...pages,
    ...stores.map(s => ({ url: `${SITE_URL}/stores/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...liveAds.map(a => ({ url: `${SITE_URL}/ad/${a.id}`, lastModified: a.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
