import type { ReactNode } from "react";
import { fontVars } from "@/lib/fonts";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

/**
 * The shared site shell: nav on top, footer at the bottom, content between.
 *
 * `forceDark` pins the dark palette for a surface that is dark by design
 * rather than by preference — the marketing landing page, whose bloom,
 * gradient headline and screen simulator all assume a dark ground. The theme
 * toggle is hidden there because it could not change anything.
 */
export function SiteChrome({
  children,
  forceDark = false,
}: {
  children: ReactNode;
  forceDark?: boolean;
}) {
  return (
    <div
      className={`${forceDark ? "dark " : ""}${fontVars} flex min-h-screen flex-col bg-ce-ground font-ce-body text-ce-text`}
    >
      <Nav showThemeToggle={!forceDark} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
