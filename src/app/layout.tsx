import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommunityBulletin.com – Digital In-Store Advertising",
  description: "Post and display digital ads at local store locations in your community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#F4F7FB", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
        <ScrollToTop />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
