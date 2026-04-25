"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Icon } from "./Icon";
import { SignOutButton } from "./SignOutButton";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 rounded-lg text-[#1A3A5C] hover:bg-[#E8EFF6] transition-colors" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-[#1A3A5C] w-64 max-w-[80vw]">
        <div className="flex flex-col h-full px-4 py-6 gap-2">
          {/* Logo */}
          <Link href="/dashboard/user" className="no-underline">
            <div className="flex items-center gap-2.5 mb-8 pl-2">
              <div className="bg-[#E8EFF6] rounded-[10px] p-1.5">
                <Icon size={28} />
              </div>
              <div>
                <div className="font-serif font-bold text-white text-[13px] leading-tight">Community</div>
                <div className="font-serif font-bold text-[#E8563A] text-[13px] leading-tight">
                  Bulletin<span className="text-[#4A90C4] text-[10px] font-normal">.com</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Nav */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3.5 py-2.5 rounded-lg text-[#9DC4E0] no-underline text-sm font-medium hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {/* Bottom */}
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
  );
}
