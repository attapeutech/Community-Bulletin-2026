import Link from "next/link";

export function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const box = size === "lg" ? "w-[26px] h-[26px] rounded-[7px]" : "w-[22px] h-[22px] rounded-md";
  const text = size === "lg" ? "text-[18px]" : "text-base";
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div
        className={`${box} bg-[linear-gradient(140deg,#3ee6d1,#4f7cff)]`}
        style={size === "lg" ? { boxShadow: "0 0 18px rgba(62,230,209,.45)" } : undefined}
      />
      <span className={`font-ce-display font-bold ${text} tracking-[-0.03em]`}>
        casteasy<span className="text-ce-muted4">.io</span>
      </span>
    </div>
  );
}

function StatusPill() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-ce-line3 bg-ce-panel py-[5px] pl-[9px] pr-[11px]">
      <span className="relative flex w-[7px] h-[7px]">
        <span className="absolute inset-0 rounded-full bg-ce-accent animate-ce-pulse" />
        <span className="relative w-[7px] h-[7px] rounded-full bg-ce-accent" />
      </span>
      <span className="font-ce-mono text-[11px] tracking-[0.06em] text-ce-muted">
        NETWORK ONLINE
      </span>
    </div>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ce-line8 bg-ce-ground/[0.72] backdrop-blur-[18px]">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-7 px-6">
        <Logo />
        <div className="hidden sm:block">
          <StatusPill />
        </div>

        <nav className="ml-auto hidden items-center gap-[26px] md:flex">
          <Link href="#audiences" className="text-sm font-medium text-ce-muted hover:text-ce-text">
            Platform
          </Link>
          <Link href="#flow" className="text-sm font-medium text-ce-muted hover:text-ce-text">
            How it works
          </Link>
          <Link href="#audiences" className="text-sm font-medium text-ce-muted hover:text-ce-text">
            Pricing
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 md:ml-0">
          <Link
            href="#audiences"
            className="hidden rounded-[9px] border border-ce-line4 bg-ce-raised px-3.5 py-[9px] text-sm font-semibold text-ce-text3 sm:inline-block"
          >
            Host a Screen
          </Link>
          <Link
            href="#audiences"
            className="rounded-[9px] bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-4 py-2.5 text-sm font-bold text-ce-onAccent"
            style={{ boxShadow: "0 0 24px rgba(62,230,209,.32)" }}
          >
            Launch Campaign
          </Link>
        </div>
      </div>
    </header>
  );
}
