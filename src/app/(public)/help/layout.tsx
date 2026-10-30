import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description: "How Community Bulletin works: posting an ad, pricing, ad review, refunds, and how store owners host a screen and get paid.",
  alternates: { canonical: "/help" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
