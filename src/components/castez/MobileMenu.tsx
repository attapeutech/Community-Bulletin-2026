"use client";

import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo, StatusPill } from "./Brand";
import { NavAuth } from "./NavAuth";
import { CeThemeToggle } from "./ThemeToggle";
import { FranchiseDemoLink, HostScreenLink, LaunchCampaignLink, NAV_LINKS } from "./NavItems";

export function MobileMenu({ showThemeToggle = true }: { showThemeToggle?: boolean }) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Radix holds a scroll lock until the close animation finishes, so both the
  // in-page scroll and the route change wait for it. Anchors are absolute
  // ("/#flow"), so away from the landing page they navigate instead of scroll.
  function goTo(href: string) {
    setOpen(false);
    const hash = href.startsWith("/#") ? href.slice(1) : null;
    window.setTimeout(() => {
      if (hash && pathname === "/") {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push(href);
      }
    }, 260);
  }

  const itemCls =
    "border-b border-ce-line2 py-3.5 text-left font-ce-body text-[15px] font-medium text-ce-muted transition-colors hover:text-ce-text";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-lg p-2 text-ce-text3 transition-colors hover:bg-white/5"
        >
          <Menu size={22} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-[min(320px,85vw)] max-w-none overflow-y-auto border-l border-ce-line3 bg-ce-ground p-0"
      >
        <div className="flex min-h-full flex-col gap-6 px-6 pb-8 pt-6">
          <div className="pr-10">
            <Logo />
          </div>

          <StatusPill />

          <div className="flex flex-col gap-2.5">
            <LaunchCampaignLink className="text-center" />
            <HostScreenLink className="text-center" />
          </div>

          <nav className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <button key={l.label} type="button" onClick={() => goTo(l.href)} className={itemCls}>
                {l.label}
              </button>
            ))}
            <FranchiseDemoLink
              onClick={() => setOpen(false)}
              className="border-b border-ce-line2 py-3.5 text-left font-ce-body text-[15px]"
            />
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            <NavAuth stacked />
            {showThemeToggle && (
              <div className="flex items-center justify-between border-t border-ce-line2 pt-4">
                <span className="text-[13px] text-ce-muted">Appearance</span>
                <CeThemeToggle />
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
