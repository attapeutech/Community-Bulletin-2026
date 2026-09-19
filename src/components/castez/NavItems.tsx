import Link from "next/link";

// Shared by Nav and MobileMenu. Kept in its own module so the two don't
// import each other.

// While this nav lives only on /v2 the section anchors stay relative, so they
// resolve on the preview. At promotion they become "/#audiences" / "/#flow" so
// they work from /help, /live-ads and the rest of the public pages.
export const NAV_LINKS = [
  { label: "Platform", href: "#audiences" },
  { label: "How it works", href: "#flow" },
  { label: "Pricing", href: "#audiences" },
  { label: "Help", href: "/help" },
];

export function LiveAdsPill({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/live-ads"
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ce-accent/30 bg-ce-accent/10 px-3 py-1.5 text-xs font-bold text-ce-accentLight transition-colors hover:bg-ce-accent/20 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ce-pulse rounded-full bg-ce-accent" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ce-accent" />
      </span>
      Live Ads
    </Link>
  );
}

export function PostAdPill({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/ads/new"
      className={`flex items-center gap-1 whitespace-nowrap rounded-full bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-3 py-1.5 text-xs font-bold text-ce-onAccent ${className}`}
      style={{ boxShadow: "0 0 20px rgba(62,230,209,.28)" }}
    >
      + Post an Ad
    </Link>
  );
}

export function FranchiseDemoLink({ className = "", onClick }: { className?: string; onClick?: () => void }) {
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
