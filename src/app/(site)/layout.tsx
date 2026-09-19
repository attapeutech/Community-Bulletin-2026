import { SiteChrome } from "@/components/castez/SiteChrome";

// Every in-app surface shares this shell. Standalone surfaces sit outside it:
// (auth), display/[slug] (kiosk) and demo (own stylesheet).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
