import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Ads Near You",
  description: "See the local ads showing right now on Community Bulletin screens in neighborhood stores. Search by store, city or business.",
  alternates: { canonical: "/live-ads" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
