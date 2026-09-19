import Link from "next/link";

// Shared by Nav, MobileMenu and Footer. Kept in its own module so Nav and
// MobileMenu don't import each other.
// Mark and wordmark follow castez-package/design-components/CastEZ Landing.dc.html:
// a three-stop teal-to-blue gradient, a white hairline and a layered neon glow,
// with the CE in the dark on-accent ink rather than white.

const MARK_GLOW =
  "0 0 0 1px rgba(62,230,209,.35), 0 0 16px rgba(62,230,209,.6), 0 0 40px rgba(62,230,209,.35), inset 0 1px 0 rgba(255,255,255,.6)";

export function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const lg = size === "lg";
  return (
    <Link
      href="/"
      aria-label="CastEasy.io home"
      className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <span
        className={`flex shrink-0 items-center justify-center border border-white/40 ${
          lg ? "h-8 w-8 rounded-[10px]" : "h-[26px] w-[26px] rounded-lg"
        }`}
        style={{
          background: "linear-gradient(150deg,#7df3e2,#2ad3bf 45%,#35b7f5)",
          boxShadow: MARK_GLOW,
        }}
      >
        <span
          aria-hidden="true"
          className={`font-ce-display font-bold leading-none tracking-[-0.02em] text-ce-onAccent ${
            lg ? "text-sm" : "text-[12px]"
          }`}
        >
          CE
        </span>
      </span>
      <span
        className={`font-ce-display font-bold tracking-[-0.03em] ${
          lg ? "text-[17px] sm:text-[19px]" : "text-base"
        }`}
      >
        CastEasy<span className="text-ce-muted4">.io</span>
      </span>
    </Link>
  );
}

export function StatusPill() {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ce-line3 bg-ce-panel py-[5px] pl-[9px] pr-[11px]">
      <span className="relative flex h-[7px] w-[7px]">
        <span className="absolute inset-0 animate-ce-pulse rounded-full bg-ce-accent" />
        <span className="relative h-[7px] w-[7px] rounded-full bg-ce-accent" />
      </span>
      <span className="font-ce-mono text-[11px] tracking-[0.06em] text-ce-muted">
        NETWORK ONLINE
      </span>
    </div>
  );
}
