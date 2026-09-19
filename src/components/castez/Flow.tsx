import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Drop the ad graphic",
    body: "Upload a PNG, JPG or MP4. Auto-fit templates handle sizing for every panel in the network.",
  },
  {
    n: "02",
    title: "Pick screens on the map",
    body: "Filter by radius, daily footfall and store category. See the nightly rate before you commit.",
  },
  {
    n: "03",
    title: "Merchant approves",
    body: "The host gets a push, reviews your creative and taps approve. Most clear in under ten minutes.",
  },
  {
    n: "04",
    title: "Real-time TV push",
    body: "A socket event slots you into the live rotation. Your ad is on the street before the queue reloads.",
  },
];

export function Flow() {
  return (
    <section id="flow" className="scroll-mt-[68px] border-b border-ce-line">
      <div className="mx-auto max-w-[1200px] px-6 py-[84px]">
        <div className="mb-[42px] max-w-[640px]">
          <div className="mb-3.5 font-ce-mono text-[11px] tracking-[0.16em] text-ce-accent">
            LIFECYCLE
          </div>
          <h2 className="m-0 font-ce-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.08] tracking-[-0.04em]">
            Graphic to glass in four moves.
          </h2>
        </div>

        {/* 1px gaps over a lighter ground render as hairline rules between cells */}
        <div className="flex flex-wrap gap-px overflow-hidden rounded-[18px] border border-ce-line2 bg-ce-line2">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="min-w-0 flex-[1_1_calc(50%-1px)] bg-ce-card px-[26px] pb-[34px] pt-[30px] min-[1040px]:flex-[1_1_calc(25%-1px)]"
            >
              <div className="mb-[26px] font-ce-mono text-xs text-ce-accent">{s.n}</div>
              <h3 className="m-0 mb-[9px] font-ce-display text-[19px] font-bold tracking-[-0.03em]">
                {s.title}
              </h3>
              <p className="m-0 text-sm leading-[1.6] text-ce-muted2">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-14 overflow-hidden rounded-[20px] border border-ce-line4 bg-[linear-gradient(160deg,rgba(62,230,209,.1),rgba(79,124,255,.07))] px-9 py-11 text-center">
          <h2 className="m-0 mb-3 font-ce-display text-[clamp(26px,3.2vw,36px)] font-bold leading-[1.1] tracking-[-0.04em]">
            Every window on your block is inventory.
          </h2>
          <p className="mx-auto mb-[26px] max-w-[520px] text-base leading-[1.6] text-ce-muted">
            Claim the screens, or claim the revenue. Both sides onboard in a single sitting.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="#audiences"
              className="rounded-[11px] bg-[linear-gradient(180deg,#5cf0dd,#26cdb9)] px-6 py-3.5 text-[15px] font-bold text-ce-onAccent"
              style={{ boxShadow: "0 14px 40px -12px rgba(62,230,209,.5)" }}
            >
              Launch Your Ad Campaign
            </Link>
            <Link
              href="#audiences"
              className="rounded-[11px] border border-ce-line7 bg-white/[0.03] px-6 py-3.5 text-[15px] font-semibold text-ce-text2"
            >
              Host a Screen &amp; Earn
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
