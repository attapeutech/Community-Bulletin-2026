import type { Metadata } from "next";
import { SiteChrome } from "@/components/castez/SiteChrome";

export const metadata: Metadata = {
  title: "CastEasy.io - The Digital Billboard Marketplace",
  description:
    "Advertisers book merchant-approved screens in local store windows. Store owners turn dead window space into a street-facing ad rotation that pays out every month.",
};

// Its own group so the landing can pin dark while the rest of the site follows
// the theme. Same chrome, one flag.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome forceDark>{children}</SiteChrome>;
}
