import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /robots.txt — keep search engines out of signed-in areas, store screens and redirect links
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/display/", "/ads/", "/go/", "/partners/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
