"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_LINKS = [
  { label: "Live Ads",    href: "/live-ads" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features",     href: "/#features" },
  { label: "Pricing",      href: "/#pricing" },
  { label: "Help",         href: "/help" },
];

const FOOTER_LINKS = [
  { title: "Advertise",  links: [{ label: "Post an ad", href: "/register" }, { label: "Live Ads", href: "/live-ads" }, { label: "How it works", href: "/#how-it-works" }, { label: "Pricing", href: "/#pricing" }] },
  { title: "For Stores", links: [{ label: "List your store", href: "/register" }, { label: "Store dashboard", href: "/dashboard/store-owner" }] },
  { title: "Account",    links: [{ label: "Sign in", href: "/login" }, { label: "Create account", href: "/register" }, { label: "Dashboard", href: "/dashboard" }] },
  { title: "Company",    links: [{ label: "Help & Support", href: "/help" }, { label: "Contact Us", href: "/contact" }, { label: "Privacy policy", href: "/privacy" }, { label: "Terms of service", href: "/terms" }] },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-[#1A3A5C] flex flex-col">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#D8E4EE] h-16 flex items-center justify-between px-4 sm:px-8 shadow-sm">
        <Link href="/" className="no-underline flex items-center gap-2.5">
          <div className="bg-[#E8EFF6] rounded-[10px] p-1.5 flex"><Icon size={28} /></div>
          <div>
            <div className="font-serif font-bold text-[14px] text-[#1A3A5C] leading-tight">Community</div>
            <div className="font-serif font-bold text-[14px] leading-tight">
              <span className="text-[#E8563A]">Bulletin</span>
              <span className="text-[#4A90C4] text-[11px] font-normal">.com</span>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="no-underline text-sm text-[#4A7FA5] font-medium hover:text-[#1A3A5C] transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="no-underline flex items-center gap-2.5 text-sm font-semibold text-white pl-1 pr-4 py-1 rounded-full bg-[#1A3A5C] hover:bg-[#0F2540] transition-colors">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} className="object-cover" />
                <AvatarFallback className="bg-[#4A90C4] text-white text-[11px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="no-underline text-sm font-semibold text-[#1A3A5C] px-4 py-2 rounded-lg border border-[#D1DDE8] hover:bg-[#F4F7FB] transition-colors">Sign in</Link>
              <Link href="/register" className="no-underline text-sm font-semibold text-white px-4 py-2 rounded-lg bg-[#1A3A5C] hover:bg-[#0F2540] transition-colors">Get started free</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#1A3A5C] hover:bg-[#F4F7FB] transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-[#D8E4EE] shadow-lg px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="no-underline text-sm text-[#4A7FA5] font-medium py-2.5 px-1 border-b border-[#F0F5FA]" onClick={() => setMobileMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <div className="h-px bg-[#E8EFF6] my-2" />
              <Link href="/dashboard" className="no-underline flex items-center gap-2.5 text-sm font-semibold text-white pl-2 pr-4 py-2 rounded-full bg-[#1A3A5C]" onClick={() => setMobileMenuOpen(false)}>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} className="object-cover" />
                  <AvatarFallback className="bg-[#4A90C4] text-white text-[11px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="h-px bg-[#E8EFF6] my-2" />
              <Link href="/login" className="no-underline text-sm font-medium py-2.5 px-1 text-[#1A3A5C] border-b border-[#F0F5FA]" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
              <Link href="/register" className="no-underline text-sm font-medium py-2.5 px-1 text-[#E8563A] font-semibold" onClick={() => setMobileMenuOpen(false)}>
                Create account — free
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0F2540] px-4 sm:px-8 pt-10 pb-6 border-t border-white/[0.08]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="bg-[#E8EFF6] rounded-lg p-1.5 flex"><Icon size={24} /></div>
                <div>
                  <div className="font-serif font-bold text-white text-[13px] leading-tight">Community</div>
                  <div className="font-serif font-bold text-[#E8563A] text-[13px] leading-tight">
                    Bulletin<span className="text-[#4A90C4] text-[10px] font-normal">.com</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#6B8FA8] leading-relaxed max-w-[220px]">
                Digital in-store advertising for local communities.
              </p>
            </div>
            {FOOTER_LINKS.map(({ title, links }) => (
              <div key={title}>
                <div className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">{title}</div>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-[#6B8FA8] no-underline hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.08] pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-[#4A7FA5]">© 2026 CommunityBulletin.com. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/help"    className="text-xs text-[#4A7FA5] no-underline hover:text-white transition-colors">Help</Link>
              <Link href="/privacy" className="text-xs text-[#4A7FA5] no-underline hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms"   className="text-xs text-[#4A7FA5] no-underline hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-xs text-[#4A7FA5]">Made with ❤️ for local communities</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
