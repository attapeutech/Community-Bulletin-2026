"use client";

import { ChevronDown, LayoutDashboard, LogOut, Megaphone, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/client";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

const ROLE_LINKS: Record<string, { href: string; label: string }[]> = {
  store_owner: [
    { href: "/dashboard/store-owner", label: "My Locations" },
    { href: "/dashboard/store-owner/earnings", label: "Earnings" },
  ],
  approver: [{ href: "/dashboard/approver", label: "Review Ads" }],
  admin: [
    { href: "/dashboard/store-owner", label: "All Locations" },
    { href: "/dashboard/approver", label: "Review Ads" },
    { href: "/dashboard/admin", label: "Admin Panel" },
  ],
};

function initialsOf(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ITEM = "text-ce-muted focus:bg-ce-text/5 focus:text-ce-text";

export function UserMenu({ user, stacked = false }: { user: SessionUser; stacked?: boolean }) {
  const router = useRouter();
  const role = user.role ?? "user";
  const roleLinks = ROLE_LINKS[role] ?? [];

  async function handleSignOut() {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
  }

  const avatar = (
    <Avatar className="h-7 w-7 shrink-0">
      <AvatarImage src={user.image ?? ""} alt="" className="object-cover" />
      <AvatarFallback className="bg-[linear-gradient(140deg,#3ee6d1,#4f7cff)] text-[11px] font-bold text-white">
        {initialsOf(user.name)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={`flex items-center gap-2 rounded-full border border-ce-line4 bg-ce-surface py-1 pl-1 pr-2.5 text-sm font-semibold text-ce-text transition-colors hover:border-ce-accent/40 ${
            stacked ? "w-full justify-start" : ""
          }`}
        >
          {avatar}
          <span className="max-w-[90px] truncate">{user.name ?? "Account"}</span>
          <ChevronDown size={14} className="shrink-0 text-ce-muted3" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="border-ce-line4 bg-ce-panel text-ce-text"
        style={{ boxShadow: "0 24px 48px -20px rgba(0,0,0,.7)" }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-[13px] font-semibold text-ce-text">
            {user.name ?? "Signed in"}
          </div>
          <div className="truncate text-[11px] text-ce-muted3">{user.email}</div>
          {role !== "user" && (
            <div className="mt-1.5 inline-block rounded px-1.5 py-0.5 font-ce-mono text-[10px] uppercase tracking-wide text-ce-accent ring-1 ring-ce-accent/30">
              {role.replace("_", " ")}
            </div>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-ce-line3" />

        <DropdownMenuItem asChild className={ITEM}>
          <Link href="/dashboard">
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM}>
          <Link href="/dashboard/user">
            <Megaphone size={15} />
            My Ads
          </Link>
        </DropdownMenuItem>

        {roleLinks.length > 0 && <DropdownMenuSeparator className="bg-ce-line3" />}
        {roleLinks.map((l) => (
          <DropdownMenuItem key={l.href} asChild className={ITEM}>
            <Link href={l.href}>{l.label}</Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-ce-line3" />

        <DropdownMenuItem asChild className={ITEM}>
          <Link href="/dashboard/profile">
            <Settings size={15} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
        >
          <LogOut size={15} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
