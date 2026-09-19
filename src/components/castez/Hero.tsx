import Link from "next/link";
import { ScreenSimulator } from "./ScreenSimulator";

const STATS = [
  { value: "$0", caption: "printing & design spend" },
  { value: "<2s", caption: "approval to on-screen" },
  { value: "100%", caption: "merchant-approved inventory" },
];

export function Hero() {
  return (
    <section className="relative border-b border-ce-line">
      {/* Teal/indigo bloom bleeding down from above the fold */}
      <div
        className="pointer-events-none absolute -top-[180px] left-1/2 h-[520px] w-[900px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(62,230,209,.16), rgba(79,124,255,.06) 55%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-center gap-14 px-6 pb-24 pt-[88px]">
        <div className="min-w-0">
          <div className="mb-[26px] inline-flex items-center gap-[9px] rounded-full border border-ce-accent/[0.28] bg-ce-accent/[0.07] px-[13px] py-1.5">
            <span className="h-[5px] w-[5px] rounded-full bg-ce-accent" />
            <span className="font-ce-mono text-[11px] tracking-[0.14em] text-ce-accentPale">
              THE DIGITAL BILLBOARD MARKETPLACE
            </span>
          </div>

          <h1 className="m-0 mb-[22px] text-balance font-ce-display text-[clamp(38px,5vw,62px)] font-bold leading-[1.03] tracking-[-0.045em]">
            Trade paper window clutter for{" "}
            <span className="bg-[linear-gradient(100deg,#5cf0dd,#7c9dff)] bg-clip-text text-transparent">
              high-impact digital billboards.
            </span>
          </h1>

          <p className="m-0 mb-[34px] max-w-[560px] text-pretty text-lg leading-[1.6] text-ce-muted">
            Advertisers skip the design studio, the print shop and the tape — upload a graphic, pick
            your blocks, go live. Store owners turn dead window space into a street-facing ad
            rotation that pays out every month. No printing fees. No stale flyers. One network.
          </p>

          <div className="mb-[34px] flex flex-wrap gap-3">
            <Link
              href="#audiences"
              className="inline-flex items-center gap-[9px] rounded-[11px] bg-[linear-gradient(180deg,#5cf0dd,#26cdb9)] px-6 py-[15px] text-[15px] font-bold text-ce-onAccent"
              style={{
                boxShadow:
                  "0 14px 40px -10px rgba(62,230,209,.55), inset 0 1px 0 rgba(255,255,255,.4)",
              }}
            >
              Launch Your Ad Campaign →
            </Link>
            <Link
              href="#audiences"
              className="inline-flex items-center gap-[9px] rounded-[11px] border border-ce-line5 bg-white/[0.02] px-6 py-[15px] text-[15px] font-semibold text-ce-text2"
            >
              Host a Screen &amp; Earn
            </Link>
          </div>

          <dl className="flex flex-wrap border-t border-ce-line2 pt-[22px]">
            {STATS.map((s, i) => (
              <div
                key={s.value}
                className={
                  i < STATS.length - 1 ? "mr-7 border-r border-ce-line2 pr-7" : undefined
                }
              >
                <dt className="font-ce-display text-2xl font-bold tracking-[-0.03em]">{s.value}</dt>
                <dd className="m-0 text-xs font-medium text-ce-muted3">{s.caption}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ScreenSimulator />
      </div>
    </section>
  );
}
