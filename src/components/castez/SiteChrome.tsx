import type { ReactNode } from "react";
import { fontVars } from "@/lib/fonts";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

/** The shared site shell: nav on top, footer at the bottom, content between. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className={`${fontVars} flex min-h-screen flex-col bg-ce-ground font-ce-body text-ce-text`}>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
