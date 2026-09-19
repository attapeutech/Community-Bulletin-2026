"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo, StatusPill } from "./Brand";
import { NavAuth } from "./NavAuth";
import { FranchiseDemoLink, LiveAdsPill, NAV_LINKS, PostAdPill } from "./NavItems";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Radix holds a scroll lock until the close animation finishes. Jumping to the
  // hash while that lock is active gets swallowed, so close first and scroll after.
  function goTo(hash: string) {
    setOpen(false);
    window.setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
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

          <div className="flex flex-wrap gap-2">
            <LiveAdsPill className="!px-4 !py-2.5 !text-sm" />
            <PostAdPill className="!px-4 !py-2.5 !text-sm" />
          </div>

          <nav className="flex flex-col">
            {NAV_LINKS.map((l) =>
              l.href.startsWith("#") ? (
                <button key={l.label} type="button" onClick={() => goTo(l.href)} className={itemCls}>
                  {l.label}
                </button>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={itemCls}
                >
                  {l.label}
                </Link>
              )
            )}
            <FranchiseDemoLink
              onClick={() => setOpen(false)}
              className="border-b border-ce-line2 py-3.5 text-left font-ce-body text-[15px]"
            />
          </nav>

          <div className="mt-auto">
            <NavAuth stacked />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
