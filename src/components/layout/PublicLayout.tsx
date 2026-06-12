"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Lightbulb, Sparkles, Tag, LifeBuoy, Store, Search, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LocationPickerDialog from "@/components/marketing/LocationPickerDialog";
import { readSavedLocation, writeSavedLocation } from "@/lib/location-preference";

type SelectedLocation = { stateCode: string; stateName: string; cityName: string };

const NAV_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "How it works", href: "/#how-it-works", icon: Lightbulb },
  { label: "Features",     href: "/#features",     icon: Sparkles  },
  { label: "Pricing",      href: "/#pricing",      icon: Tag       },
  { label: "Help",         href: "/help",           icon: LifeBuoy  },
];

const FOOTER_LINKS = [
  { title: "Advertise",  links: [{ label: "Post an ad", href: "/register" }, { label: "How it works", href: "/#how-it-works" }, { label: "Pricing", href: "/#pricing" }] },
  { title: "For Stores", links: [{ label: "List your store", href: "/register" }, { label: "Store dashboard", href: "/dashboard/store-owner" }] },
  { title: "Account",    links: [{ label: "Sign in", href: "/login" }, { label: "Create account", href: "/register" }, { label: "Dashboard", href: "/dashboard" }] },
  { title: "Company",    links: [{ label: "Help & Support", href: "/help" }, { label: "Contact Us", href: "/contact" }, { label: "Privacy policy", href: "/privacy" }, { label: "Terms of service", href: "/terms" }] },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readSavedLocation();
    if (stored) setSelectedLocation(stored);
  }, []);

  const pushLiveAds = useCallback((loc: SelectedLocation | null, q: string) => {
    const params = new URLSearchParams();
    if (loc?.stateCode) params.set("state", loc.stateCode);
    if (loc?.cityName)  params.set("city",  loc.cityName);
    if (q.trim())       params.set("search", q.trim());
    router.push(`/live-ads${params.toString() ? `?${params}` : ""}`);
  }, [router]);

  const handleLocationSave = (loc: SelectedLocation | null) => {
    setSelectedLocation(loc);
    writeSavedLocation(loc);
    setLocationPickerOpen(false);
    pushLiveAds(loc, searchInput);
  };

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushLiveAds(selectedLocation, val), 400);
  };

  const locationLabel = selectedLocation
    ? selectedLocation.cityName
      ? `${selectedLocation.cityName}, ${selectedLocation.stateCode}`
      : selectedLocation.stateName || selectedLocation.stateCode
    : null;

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-[#1A3A5C] flex flex-col">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#D8E4EE] shadow-sm flex flex-col">

        {/* Row 1 — always visible */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-8 gap-3">

          {/* Logo */}
          <Link href="/" className="no-underline flex items-center gap-2.5 shrink-0">
            <div className="bg-[#E8EFF6] rounded-[10px] p-1.5 flex"><Icon size={28} /></div>
            <div>
              <div className="font-serif font-bold text-[14px] text-[#1A3A5C] leading-tight">Community</div>
              <div className="font-serif font-bold text-[14px] leading-tight">
                <span className="text-[#E8563A]">Bulletin</span>
                <span className="text-[#4A90C4] text-[11px] font-normal">.com</span>
              </div>
            </div>
          </Link>

          {/* Desktop: location picker + search */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm mx-4">
            <button
              onClick={() => setLocationPickerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0"
              style={{
                border: `1px solid ${locationLabel ? "#4A90C4" : "#D8E4EE"}`,
                background: locationLabel ? "#EDF5FF" : "#F7FAFC",
                color: locationLabel ? "#1A3A5C" : "#6B8FA8",
              }}
            >
              <MapPin size={12} />
              {locationLabel ?? "All locations"}
              {locationLabel && (
                <span
                  onClick={(e) => { e.stopPropagation(); handleLocationSave(null); }}
                  className="ml-0.5 text-[#6B8FA8] font-normal text-sm leading-none"
                >×</span>
              )}
            </button>
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9DB8CC] pointer-events-none" />
              <input
                type="text"
                placeholder="Search live ads…"
                value={searchInput}
                onChange={e => handleSearch(e.target.value)}
                className="w-full pl-8 pr-6 py-1.5 border border-[#D8E4EE] rounded-lg text-sm text-[#1A3A5C] bg-[#FAFCFF] outline-none focus:border-[#4A90C4] transition-colors"
              />
              {searchInput && (
                <button onClick={() => handleSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9DB8CC] bg-transparent border-none cursor-pointer text-base leading-none">×</button>
              )}
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/live-ads" className="no-underline flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Live Ads
            </Link>
            <Link href="/dashboard/user" className="no-underline flex items-center gap-1 bg-[#E8563A] hover:bg-[#D04530] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors">
              + Post New Ad
            </Link>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="no-underline flex items-center gap-1.5 text-sm text-[#4A7FA5] font-medium hover:text-[#1A3A5C] transition-colors">
                <l.icon size={14} />
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
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

          {/* Mobile: location pill + hamburger */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <button
              onClick={() => setLocationPickerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{
                border: `1px solid ${locationLabel ? "#4A90C4" : "#D8E4EE"}`,
                background: locationLabel ? "#EDF5FF" : "#F7FAFC",
                color: locationLabel ? "#1A3A5C" : "#6B8FA8",
              }}
            >
              <MapPin size={13} />
              {locationLabel && <span className="max-w-[72px] truncate">{locationLabel}</span>}
            </button>
            <button
              className="p-2 rounded-lg text-[#1A3A5C] hover:bg-[#F4F7FB] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Row 2 — mobile search bar */}
        <div className="md:hidden h-11 px-4 flex items-center gap-2 border-t border-[#F0F5FA] bg-white">
          <Search size={13} className="text-[#9DB8CC] shrink-0" />
          <input
            type="text"
            placeholder="Search live ads…"
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 text-sm text-[#1A3A5C] bg-transparent outline-none placeholder:text-[#9DB8CC]"
          />
          {searchInput && (
            <button onClick={() => handleSearch("")} className="text-[#9DB8CC] bg-transparent border-none cursor-pointer text-base leading-none">×</button>
          )}
        </div>
      </nav>

      {/* Mobile hamburger dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[108px] left-0 right-0 z-40 bg-white border-b border-[#D8E4EE] shadow-lg px-4 py-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/live-ads" onClick={() => setMobileMenuOpen(false)} className="no-underline flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Live Ads
            </Link>
            <Link href="/dashboard/user" onClick={() => setMobileMenuOpen(false)} className="no-underline flex items-center gap-1 bg-[#E8563A] hover:bg-[#D04530] text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors">
              + Post New Ad
            </Link>
          </div>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="no-underline flex items-center gap-2.5 text-sm text-[#4A7FA5] font-medium py-2.5 px-1 border-b border-[#F0F5FA]" onClick={() => setMobileMenuOpen(false)}>
              <l.icon size={15} className="shrink-0 text-[#9DB8CC]" />
              {l.label}
            </Link>
          ))}
          <div className="h-px bg-[#E8EFF6] my-2" />
          {user ? (
            <Link href="/dashboard" className="no-underline flex items-center gap-2.5 text-sm font-semibold text-white pl-2 pr-4 py-2 rounded-full bg-[#1A3A5C]" onClick={() => setMobileMenuOpen(false)}>
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} className="object-cover" />
                <AvatarFallback className="bg-[#4A90C4] text-white text-[11px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="no-underline text-sm font-medium py-2.5 px-1 text-[#1A3A5C] border-b border-[#F0F5FA]" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
              <Link href="/register" className="no-underline text-sm font-semibold py-2.5 px-1 text-[#E8563A]" onClick={() => setMobileMenuOpen(false)}>Create account — free</Link>
            </>
          )}
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 pt-[108px] md:pt-16">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0F2540] px-4 sm:px-8 pt-10 pb-6 border-t border-white/[0.08]">
        <div className="max-w-4xl mx-auto">
          {/* Live Ads + Post New Ad CTA strip */}
          <div className="flex items-center gap-3 flex-wrap mb-8 pb-8 border-b border-white/[0.08]">
            <Link href="/live-ads" className="no-underline flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-full transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Live Ads
            </Link>
            <Link href="/dashboard/user" className="no-underline flex items-center gap-1 bg-[#E8563A] hover:bg-[#D04530] text-white text-sm font-bold px-4 py-2 rounded-full transition-colors">
              + Post New Ad
            </Link>
            <span className="text-sm text-[#6B8FA8]">Browse live ads or start your own campaign</span>
          </div>

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
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-3.5 tracking-wider uppercase">
                  {title === "For Stores" && <Store size={12} className="shrink-0" />}
                  {title}
                </div>
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

      <LocationPickerDialog
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSave={handleLocationSave}
        initial={selectedLocation}
      />
    </div>
  );
}
