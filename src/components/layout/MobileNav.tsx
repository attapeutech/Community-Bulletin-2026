"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Sheet, SheetTrigger, SheetClose, SheetContent } from "@/components/ui/sheet";
import { Icon } from "@/components/layout/Icon";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { Badge } from "@/components/ui/badge";

type NavItem = { href: string; label: string };

export function MobileNav({
  navItems,
  userName,
  userEmail,
  role,
}: {
  navItems: NavItem[];
  userName: string;
  userEmail: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#1A3A5C] border-b border-white/10 flex items-center justify-between px-4">
      <Link href="/dashboard/user" className="no-underline flex items-center gap-2">
        <div className="bg-[#E8EFF6] rounded-[10px] p-1.5">
          <Icon size={24} />
        </div>
        <div>
          <div className="font-serif font-bold text-white text-[12px] leading-tight">Community</div>
          <div className="font-serif font-bold text-[#E8563A] text-[12px] leading-tight">
            Bulletin<span className="text-[#4A90C4] text-[10px] font-normal">.com</span>
          </div>
        </div>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="text-white p-1.5" aria-label="Open navigation">
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-[#1A3A5C] w-64 max-w-[80vw]">
          <div className="flex flex-col h-full px-4 py-6 gap-2">
            {/* Header row with close */}
            <div className="flex items-center justify-between mb-4 pl-2">
              <div>
                <div className="font-serif font-bold text-white text-[13px] leading-tight">Community</div>
                <div className="font-serif font-bold text-[#E8563A] text-[13px] leading-tight">
                  Bulletin<span className="text-[#4A90C4] text-[10px] font-normal">.com</span>
                </div>
              </div>
              <SheetClose asChild>
                <button className="text-white/60 hover:text-white p-1" aria-label="Close navigation">
                  <X className="w-5 h-5" />
                </button>
              </SheetClose>
            </div>

            {/* Nav links */}
            {navItems.map((item) => (
              <SheetClose key={item.href} asChild>
                <Link
                  href={item.href}
                  className="block px-3.5 py-2.5 rounded-lg text-[#9DC4E0] no-underline text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}

            {/* User info + sign out */}
            <div className="mt-auto border-t border-white/10 pt-4">
              <div className="px-3.5 py-2 mb-1">
                <div className="text-[13px] font-semibold text-white">{userName}</div>
                <div className="text-[11px] text-[#9DC4E0] mt-0.5">{userEmail}</div>
                <Badge className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide bg-[#E8563A] text-white border-0 rounded px-2 py-0.5">
                  {role.replace("_", " ")}
                </Badge>
              </div>
              <SignOutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
