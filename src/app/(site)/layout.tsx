import type { Metadata } from "next";
import { SiteChrome } from "@/components/castez/SiteChrome";

export const metadata: Metadata = {
  title: "CastEasy.io - The Digital Billboard Marketplace",
  description:
    "Advertisers book merchant-approved screens in local store windows. Store owners turn dead window space into a street-facing ad rotation that pays out every month.",
};

// Every in-app surface shares this shell, the landing page included -- the
// design gives it a light theme too, so nothing here pins a mode. Standalone
// surfaces sit outside: (auth), display/[slug] (kiosk) and demo (own CSS).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
