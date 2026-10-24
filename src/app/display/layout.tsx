import type { Metadata, Viewport } from "next";

// Display screens: when added to an iPhone/iPad home screen, open full screen without browser bars.
// The manifest has no start_url, so each store's screen opens to its own page.
export const metadata: Metadata = {
  title: "CommunityBulletin Display",
  manifest: "/display.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CB Display",
    statusBarStyle: "black-translucent",
  },
  // Older iOS versions only recognise Apple's own tag
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#0A1A2E",
  viewportFit: "cover",
};

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
