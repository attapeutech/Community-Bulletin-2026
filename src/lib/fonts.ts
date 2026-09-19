import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";

// Shared by every CastEZ surface (landing, auth, and the site layout) so the
// families are declared once. Latin only: the design export shipped 20 woff2
// files including Cyrillic, Greek and Vietnamese subsets we never serve.

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

/** Class list that exposes the three font CSS variables. */
export const fontVars = `${manrope.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`;
