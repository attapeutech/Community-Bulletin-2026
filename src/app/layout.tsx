import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommunityBulletin.com – Digital In-Store Advertising",
  description: "Post and display digital ads at local store locations in your community.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <ScrollToTop />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
