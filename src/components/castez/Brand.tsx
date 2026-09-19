// Shared by Nav, MobileMenu and Footer. Kept in its own module so Nav and
// MobileMenu don't import each other.

export function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const box = size === "lg" ? "w-[26px] h-[26px] rounded-[7px]" : "w-[22px] h-[22px] rounded-md";
  const mark = size === "lg" ? "text-[11px]" : "text-[9px]";
  const text = size === "lg" ? "text-base sm:text-[18px]" : "text-base";
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <div
        className={`${box} flex shrink-0 items-center justify-center bg-[linear-gradient(140deg,#3ee6d1,#4f7cff)]`}
        style={size === "lg" ? { boxShadow: "0 0 18px rgba(62,230,209,.45)" } : undefined}
      >
        <span
          aria-hidden="true"
          className={`font-ce-display font-bold leading-none tracking-[0.02em] text-white ${mark}`}
        >
          CE
        </span>
      </div>
      <span className={`font-ce-display font-bold ${text} tracking-[-0.03em]`}>
        CastEasy<span className="text-ce-muted4">.io</span>
      </span>
    </div>
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
