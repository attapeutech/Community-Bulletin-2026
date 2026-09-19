import Link from "next/link";
import { NEON_CTA, NEON_CTA_STYLE } from "./navStyles";

// Shared by Nav and MobileMenu. Kept in its own module so the two don't
// import each other.

// Absolute so they resolve from anywhere the nav appears -- /help, /live-ads,
// the dashboard -- not just from the landing page.
export const NAV_LINKS = [
  { label: "Platform", href: "/#audiences" },
  { label: "How it works", href: "/#flow" },
  { label: "Pricing", href: "/#audiences" },
];

export function GetStartedLink({ className = "" }: { className?: string }) {
  return (
    <Link href="/register" className={`${NEON_CTA} ${className}`} style={NEON_CTA_STYLE}>
      Get started free
    </Link>
  );
}

export function LogInLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/login"
      className={`whitespace-nowrap px-1 py-[9px] text-sm font-semibold text-ce-muted transition-colors hover:text-ce-text ${className}`}
    >
      Log in
    </Link>
  );
}

export function FranchiseDemoLink({
  className = "",
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href="/demo"
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`whitespace-nowrap font-semibold text-ce-blueLight transition-colors hover:text-ce-text4 ${className}`}
    >
      Franchise Demo ↗
    </a>
  );
}
