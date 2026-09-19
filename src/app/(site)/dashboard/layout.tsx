import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";

// Nested inside (site), so the nav, footer, branding and sign-out all come
// from SiteChrome. This layout contributes only the role-filtered sidebar --
// its former logo block, user card, sign-out button and mobile header bar
// were duplicates of what the site nav and user menu now provide.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role ?? "user";

  const navItems = [
    { href: "/dashboard/user", label: "My Ads", roles: ["user", "store_owner", "approver", "admin"] },
    {
      href: "/dashboard/store-owner",
      label: role === "admin" ? "All Locations" : "My Locations",
      roles: ["store_owner", "admin"],
    },
    { href: "/dashboard/store-owner/earnings", label: "Earnings", roles: ["store_owner", "admin"] },
    { href: "/dashboard/approver", label: "Review Ads", roles: ["approver", "admin"] },
    { href: "/dashboard/admin", label: "Admin Panel", roles: ["admin"] },
    { href: "/dashboard/admin/geo", label: "Geography", roles: ["admin"] },
    { href: "/dashboard/profile", label: "Account", roles: ["user", "store_owner", "approver", "admin"] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="mx-auto flex w-full max-w-[1200px] gap-8 px-4 py-8 sm:px-6">
      <aside className="hidden w-52 shrink-0 md:block">
        <nav className="sticky top-[92px] flex flex-col gap-1">
          <div className="mb-2 px-3 font-ce-mono text-[11px] tracking-[0.14em] text-ce-muted4">
            DASHBOARD
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ce-muted transition-colors hover:bg-ce-text/5 hover:text-ce-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Below md the sidebar is hidden; these keep the sections reachable. */}
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-ce-line4 bg-ce-surface px-3.5 py-2 text-[13px] font-medium text-ce-muted transition-colors hover:text-ce-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
