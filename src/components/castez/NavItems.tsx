import Link from "next/link";

// Shared by Nav and MobileMenu. Kept in its own module so the two don't
// import each other.

// Absolute so they resolve from anywhere the nav appears -- /help, /live-ads,
// the dashboard -- not just from the landing page.
export const NAV_LINKS = [
  { label: "Platform", href: "/#audiences" },
  { label: "How it works", href: "/#flow" },
  { label: "Pricing", href: "/#audiences" },
  { label: "Live Ads", href: "/live-ads" },
];

/** Secondary CTA: the host side of the marketplace. */
export function HostScreenLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/register"
      className={`whitespace-nowrap rounded-[9px] border border-ce-line4 bg-ce-raised px-3.5 py-2.5 text-sm font-semibold text-ce-text3 transition-colors hover:border-ce-line5 ${className}`}
    >
      Host a Screen
    </Link>
  );
}

/** Primary CTA: starts the ad submission flow. */
export function LaunchCampaignLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/ads/new"
      className={`whitespace-nowrap rounded-[9px] bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-4 py-2.5 text-sm font-bold text-ce-onAccent ${className}`}
      style={{ boxShadow: "0 0 24px rgba(62,230,209,.32)" }}
    >
      Launch Campaign
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
