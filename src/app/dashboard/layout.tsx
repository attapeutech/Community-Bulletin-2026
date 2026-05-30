import { requireAuth } from "@/lib/auth/session";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { MobileNav } from "@/components/layout/MobileNav";
import { Badge } from "@/components/ui/badge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const role = (session.user as any).role as string;
  const user = session.user as any;

  const navItems = [
    { href: "/dashboard/user",        label: "My Ads",        roles: ["user", "store_owner", "approver", "admin"] },
    { href: "/dashboard/store-owner", label: role === "admin" ? "All Locations" : "My Locations", roles: ["store_owner", "admin"] },
    { href: "/dashboard/approver",    label: "Review Ads",    roles: ["approver", "admin"] },
    { href: "/dashboard/admin",       label: "Admin Panel",   roles: ["admin"] },
    { href: "/dashboard/admin/geo",   label: "Geography",     roles: ["admin"] },
    { href: "/dashboard/profile",     label: "Account",       roles: ["user", "store_owner", "approver", "admin"] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-[#F4F7FB]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#1A3A5C] flex-col shrink-0 px-4 py-6 gap-2">
        {/* Logo */}
        <Link href="/" className="no-underline">
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
        <Link href="/" className="no-underline flex items-center gap-2">
          <div className="bg-[#E8EFF6] rounded-lg p-1">
            <Icon size={22} />
          </div>
          <div className="font-serif font-bold text-[13px] text-[#1A3A5C] leading-tight">
            Community<span className="text-[#E8563A]">Bulletin</span>
          </div>
        </Link>
        <div className="w-8" /> {/* spacer to center logo */}
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
