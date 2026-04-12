import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = (session.user as any).role as string;
  const user = session.user as any;

  const navItems = [
    { href: "/dashboard/user",        label: "My Ads",        roles: ["user", "store_owner", "approver", "admin"] },
    { href: "/dashboard/store-owner", label: role === "admin" ? "All Locations" : "My Locations", roles: ["store_owner", "admin"] },
    { href: "/dashboard/approver",    label: "Review Ads",    roles: ["approver", "admin"] },
    { href: "/dashboard/admin",       label: "Admin Panel",   roles: ["admin"] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F7FB" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: "#1A3A5C",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        gap: 8,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <Link href="/dashboard/user" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 8 }}>
            <div style={{ background: "#E8EFF6", borderRadius: 10, padding: 6 }}>
              <Icon size={28} />
            </div>
            <div>
              <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, color: "#fff", fontSize: 13, lineHeight: 1.1 }}>Community</div>
              <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, color: "#E8563A", fontSize: 13, lineHeight: 1.1 }}>
                Bulletin<span style={{ color: "#4A90C4", fontSize: 10, fontWeight: 400 }}>.com</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Nav */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "10px 14px",
              borderRadius: 8,
              color: "#9DC4E0",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {item.label}
          </Link>
        ))}

        {/* Bottom: user info + sign out */}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
          <div style={{ padding: "8px 14px", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#9DC4E0", marginTop: 2 }}>{user.email}</div>
            <div style={{
              display: "inline-block",
              marginTop: 6,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 4,
              background: "#E8563A",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {role.replace("_", " ")}
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
