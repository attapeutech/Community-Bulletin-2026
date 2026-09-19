"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo, StatusPill } from "./Brand";

const LINKS = [
  { href: "#audiences", label: "Platform" },
  { href: "#flow", label: "How it works" },
  { href: "#audiences", label: "Pricing" },
];

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-lg p-2 text-ce-text3 transition-colors hover:bg-white/5 md:hidden"
        >
          <Menu size={22} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-[min(320px,85vw)] max-w-none border-l border-ce-line3 bg-ce-ground p-0"
      >
        <div className="flex h-full flex-col gap-7 px-6 pb-8 pt-6">
          <div className="pr-10">
            <Logo />
          </div>

          <StatusPill />

          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={() => goTo(l.href)}
                className="border-b border-ce-line2 py-3.5 text-left font-ce-body text-[15px] font-medium text-ce-muted transition-colors hover:text-ce-text"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => goTo("#audiences")}
              className="rounded-[9px] border border-ce-line4 bg-ce-raised px-4 py-3 text-center text-sm font-semibold text-ce-text3"
            >
              Host a Screen
            </button>
            <button
              type="button"
              onClick={() => goTo("#audiences")}
              className="rounded-[9px] bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-4 py-3 text-center text-sm font-bold text-ce-onAccent"
              style={{ boxShadow: "0 0 24px rgba(62,230,209,.32)" }}
            >
              Launch Campaign
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
