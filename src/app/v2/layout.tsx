import type { Metadata } from "next";
import { Manrope, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

// Self-hosted by next/font at build time, latin only. The design's own export
// inlined 20 woff2 files including Cyrillic/Greek/Vietnamese subsets we never serve.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "casteasy.io - The Digital Billboard Marketplace",
  description:
    "Advertisers book merchant-approved screens in local store windows. Store owners turn dead window space into a street-facing ad rotation that pays out every month.",
};

export default function CastEZLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${manrope.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} font-ce-body bg-ce-ground text-ce-text min-h-screen`}
    >
      {children}
    </div>
  );
}
