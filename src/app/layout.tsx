import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CommunityBulletin.com – Digital In-Store Advertising",
  description: "Post and display digital ads at local store locations in your community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0, background: "#F4F7FB" }}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
