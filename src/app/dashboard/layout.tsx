import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { NavIcon, type NavIconName } from "@/components/layout/NavIcon";
import { UserMenu } from "@/components/layout/UserMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const role = (session.user as any).role as string;
  const user = session.user as any;

  const navItems = ([
    { href: "/dashboard/user",        label: "My Ads",        icon: "ads",       roles: ["user", "store_owner", "approver", "admin"] },
    { href: "/dashboard/saved",       label: "Saved",         icon: "saved",     roles: ["user", "store_owner", "approver", "admin"] },
    { href: "/dashboard/store-owner",          label: role === "admin" ? "All Locations" : "My Locations", icon: "locations", roles: ["store_owner", "admin"] },
    { href: "/dashboard/store-owner/earnings", label: "Earnings",   icon: "earnings",  roles: ["store_owner", "admin"] },
    { href: "/dashboard/approver",             label: "Review Ads", icon: "review",    roles: ["approver", "admin"] },
    { href: "/dashboard/admin",       label: "Admin Panel",   icon: "admin",     roles: ["admin"] },
    { href: "/dashboard/sales",       label: "Sales",         icon: "sales",     roles: ["admin"] },
    { href: "/dashboard/admin/applications", label: "Applications", icon: "applications", roles: ["admin"] },
    { href: "/dashboard/admin/payouts", label: "Payouts",     icon: "payouts",   roles: ["admin"] },
    { href: "/dashboard/admin/screens", label: "Screens",     icon: "screens",   roles: ["admin"] },
    { href: "/dashboard/admin/geo",   label: "Geography",     icon: "geography", roles: ["admin"] },
    { href: "/partners/apply",         label: "Become a Store Partner", icon: "partner", roles: ["user"] },
    { href: "/dashboard/profile",     label: "Account",       icon: "account",   roles: ["user", "store_owner", "approver", "admin"] },
    { href: "/help",                   label: "Help & Support", icon: "help",    roles: ["user", "store_owner", "approver", "admin"] },
  ] satisfies { href: string; label: string; icon: NavIconName; roles: string[] }[])
    .filter((item) => item.roles.includes(role))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <div className="flex min-h-screen bg-[#F4F7FB]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#1A3A5C] flex-col shrink-0 px-4 py-6 gap-2">
        {/* Logo + notifications */}
        <div className="flex items-center justify-between gap-1 mb-8">
          <Link href="/" className="no-underline">
            <div className="pl-1">
              <BrandLogo tone="dark" height={50} />
            </div>
          </Link>
          <NotificationBell variant="dark" align="left" />
        </div>

        {/* Nav */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#9DC4E0] no-underline text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        ))}

        {/* Bottom: user info + sign out */}
        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="px-3.5 py-2 mb-1">
            <div className="text-[13px] font-semibold text-white">{user.name}</div>
            <div className="text-[11px] text-[#9DC4E0] mt-0.5">{user.email}</div>
            <Badge className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide bg-[#E8563A] text-white border-0 rounded px-2 py-0.5">
              {role.replace("_", " ")}
            </Badge>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-[#D8E4EE] flex items-center justify-between px-4 shadow-sm">
        <MobileNav
          navItems={navItems}
          userName={user.name}
          userEmail={user.email}
          role={role}
        />
        <Link href="/" className="no-underline flex items-center">
          <BrandLogo tone="light" height={40} />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell align="right" />
          <UserMenu name={user.name} email={user.email} image={user.image} role={role} />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
