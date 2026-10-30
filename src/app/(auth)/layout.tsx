import type { Metadata } from "next";

// Sign-in and account pages: keep them out of search results
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
