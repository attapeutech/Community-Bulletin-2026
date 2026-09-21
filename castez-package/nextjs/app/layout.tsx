import type { Metadata } from "next";
import { Manrope, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "casteasy.io — The hyper-local digital billboard marketplace",
  description:
    "Trade paper window clutter for high-impact digital billboards. Advertisers go live in seconds; host locations earn passive revenue.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${display.variable} ${mono.variable}`}>
      <body className="bg-[#07080b] font-sans text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
