import type { Metadata } from "next";
import { fontVars } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "CastEasy.io - The Digital Billboard Marketplace",
  description:
    "Advertisers book merchant-approved screens in local store windows. Store owners turn dead window space into a street-facing ad rotation that pays out every month.",
};

// The landing page is dark by design -- the bloom, the gradient headline and
// the screen simulator all assume a dark ground -- so it pins `dark` rather
// than following the theme. App chrome (nav, dialog) adapts via the tokens.
export default function CastEZLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`dark ${fontVars} font-ce-body bg-ce-ground text-ce-text min-h-screen`}>
      {children}
    </div>
  );
}
