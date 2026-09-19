import Link from "next/link";
import { Logo } from "./Nav";

const COLUMNS = [
  {
    label: "ADVERTISERS",
    links: [
      { text: "Browse screens", href: "#audiences" },
      { text: "Creative specs", href: "#flow" },
      { text: "Pricing by block", href: "#audiences" },
    ],
  },
  {
    label: "HOSTS",
    links: [
      { text: "Apply a location", href: "#audiences" },
      { text: "Payouts & Stripe", href: "#audiences" },
      { text: "Approval controls", href: "#audiences" },
    ],
  },
  {
    label: "COMPANY",
    links: [
      { text: "Network status", href: "#flow" },
      { text: "Support", href: "#flow" },
      { text: "Privacy", href: "#flow" },
    ],
  },
];

export function Footer() {
  return (
    <footer>
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-9 px-6 pb-9 pt-14">
        <div className="min-w-0">
          <div className="mb-3.5">
            <Logo size="sm" />
          </div>
          <p className="m-0 mb-3.5 max-w-[280px] text-[13px] leading-[1.6] text-ce-muted3">
            The hyper-local digital billboard marketplace. Merchant-approved screens, live in
            seconds.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg border border-ce-line3 bg-ce-panel px-[11px] py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ce-accent" />
            <span className="font-ce-mono text-[11px] text-ce-muted2">castez.io → casteasy.io</span>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.label} className="flex min-w-0 flex-col gap-2.5">
            <div className="mb-1 font-ce-mono text-[11px] tracking-[0.14em] text-ce-muted5">
              {col.label}
            </div>
            {col.links.map((l) => (
              <Link
                key={l.text}
                href={l.href}
                className="text-sm text-ce-muted hover:text-ce-accentLight"
              >
                {l.text}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-ce-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-5">
          <span className="text-xs text-ce-muted5">
            © 2026 CastEZ, Inc. — casteasy.io. &ldquo;CastEZ&rdquo; and &ldquo;castez.io&rdquo; are
            branding of casteasy.io.
          </span>
          <span className="font-ce-mono text-[11px] text-ce-muted5">
            ALL SCREENS MERCHANT-APPROVED
          </span>
        </div>
      </div>
    </footer>
  );
}
