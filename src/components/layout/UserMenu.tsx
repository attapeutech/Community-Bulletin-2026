"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, House, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavIcon, type NavIconName } from "@/components/layout/NavIcon";
import { cn } from "@/lib/utils";

const initialsOf = (name?: string | null) =>
  name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

/**
 * The signed-in user's menu: the avatar opens a flyout (tap / click, or hover with a mouse) with
 * My Ads, Saved, Dashboard, Admin Panel (admins) and Sign out, so Sign out is reachable on phones.
 * `label` shows text beside the avatar (the website's desktop header shows the first name).
 */
export function UserMenu({ name, email, image, role, label, className }: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Hover opens it for a mouse; a short delay lets the pointer travel from the avatar to the menu
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  };

  const items: { href: string; label: string; icon: NavIconName | "dashboard" }[] = [
    { href: "/dashboard/user", label: "My Ads", icon: "ads" },
    { href: "/dashboard/saved", label: "Saved", icon: "saved" },
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    ...(role === "admin" ? [{ href: "/dashboard/admin", label: "Admin Panel", icon: "admin" as const }] : []),
  ];

  async function handleSignOut() {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
  }

  const itemClass = "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-[#1A3A5C] dark:text-[#DCE8F2] no-underline outline-none cursor-pointer data-[highlighted]:bg-[#EEF4FA] dark:data-[highlighted]:bg-white/10";

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          className={cn(
            "flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4A90C4]",
            label ? "pl-1 pr-3 py-1 bg-[#1A3A5C] hover:bg-[#0F2540] text-white text-sm font-semibold transition-colors" : "p-0.5",
            className,
          )}
        >
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={image ?? ""} alt={name ?? ""} className="object-cover" />
            <AvatarFallback className="bg-[#4A90C4] text-white text-[11px] font-bold">{initialsOf(name)}</AvatarFallback>
          </Avatar>
          {label && <><span className="max-w-[110px] truncate">{label}</span><ChevronDown size={15} className="opacity-80" /></>}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          className="z-[1000] w-60 rounded-xl border border-[#D8E4EE] dark:border-[#1E3550] bg-white dark:bg-[#0F2236] p-1.5 shadow-xl"
        >
          <div className="px-3 pt-2 pb-2.5 mb-1 border-b border-[#E8EFF6] dark:border-[#1E3550]">
            <div className="text-sm font-semibold text-[#1A3A5C] dark:text-white truncate">{name}</div>
            {email && <div className="text-xs text-[#4A6B82] dark:text-[#9DC4E0] truncate">{email}</div>}
            {role && <div className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-wide bg-[#E8563A] text-white rounded px-2 py-0.5">{role.replace("_", " ")}</div>}
          </div>
          {items.map(it => (
            <DropdownMenu.Item key={it.href} asChild>
              <Link href={it.href} className={itemClass}>
                {it.icon === "dashboard" ? <House size={17} strokeWidth={1.9} className="shrink-0 opacity-90" aria-hidden="true" /> : <NavIcon name={it.icon} />}
                {it.label}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-[#E8EFF6] dark:bg-[#1E3550]" />
          <DropdownMenu.Item onSelect={handleSignOut} className={cn(itemClass, "text-[#C2410C] dark:text-[#F7A27E]")}>
            <LogOut size={17} strokeWidth={1.9} className="shrink-0" aria-hidden="true" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
