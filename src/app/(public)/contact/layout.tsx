import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about advertising on in-store screens or hosting a screen at your store? Send Community Bulletin a message.",
  alternates: { canonical: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
