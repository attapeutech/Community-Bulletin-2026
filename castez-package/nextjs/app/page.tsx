import Link from "next/link";
import Navbar from "@/components/Navbar";
import ScreenSimulation from "@/components/ScreenSimulation";
import AudienceTabs from "@/components/AudienceTabs";

const STEPS = [
  ["01", "Drop the ad graphic", "Upload a PNG, JPG or MP4. Auto-fit templates handle sizing for every panel in the network."],
  ["02", "Pick screens on the map", "Filter by radius, daily footfall and store category. See the nightly rate before you commit."],
  ["03", "Merchant approves", "The host gets a push, reviews your creative and taps approve. Most clear in under ten minutes."],
  ["04", "Real-time TV push", "A socket event slots you into the live rotation. Your ad is on the street before the queue reloads."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-ink text-zinc-100">
      <Navbar />

      {/* HERO */}
      <section className="relative border-b border-[#14171c]">
        <div className="pointer-events-none absolute -top-[180px] left-1/2 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(62,230,209,0.16),rgba(79,124,255,0.06)_55%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 px-6 pb-24 pt-[88px] lg:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-300/30 bg-emerald-300/[0.07] px-3.5 py-1.5">
              <span className="h-[5px] w-[5px] rounded-full bg-emerald-300" />
              <span className="font-mono text-[11px] tracking-[0.14em] text-emerald-200">THE DIGITAL BILLBOARD MARKETPLACE</span>
            </div>
            <h1 className="mb-5 text-balance font-display text-[clamp(38px,5vw,62px)] font-bold leading-[1.03] tracking-tighter">
              Trade paper window clutter for{" "}
              <span className="bg-gradient-to-r from-[#5cf0dd] to-[#7c9dff] bg-clip-text text-transparent">high-impact digital billboards.</span>
            </h1>
            <p className="mb-8 max-w-[560px] text-pretty text-lg leading-relaxed text-zinc-400">
              Advertisers skip the design studio, the print shop and the tape — upload a graphic, pick your blocks, go live. Store owners turn dead window space into a street-facing ad rotation that pays out every month. No printing fees. No stale flyers. One network.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <a href="#audiences" className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-[#5cf0dd] to-[#26cdb9] px-6 py-[15px] text-[15px] font-bold text-brand-ink shadow-glow">
                Launch Your Ad Campaign →
              </a>
              <a href="#audiences" className="inline-flex items-center gap-2.5 rounded-xl border border-zinc-700 bg-white/[0.02] px-6 py-[15px] text-[15px] font-semibold text-zinc-100 hover:bg-white/5">
                Host a Screen &amp; Earn
              </a>
            </div>
            <dl className="flex flex-wrap border-t border-zinc-900 pt-6">
              {[["$0", "printing & design spend"], ["<2s", "approval to on-screen"], ["100%", "merchant-approved inventory"]].map(([n, l], i) => (
                <div key={n} className={i < 2 ? "mr-7 border-r border-zinc-900 pr-7" : ""}>
                  <dt className="font-display text-2xl font-bold tracking-tight">{n}</dt>
                  <dd className="text-xs font-medium text-zinc-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ScreenSimulation />
        </div>
      </section>

      <AudienceTabs />

      {/* FLOW */}
      <section id="flow" className="border-b border-[#14171c]">
        <div className="mx-auto max-w-[1200px] px-6 py-[84px]">
          <div className="mb-10 max-w-[640px]">
            <div className="mb-3.5 font-mono text-[11px] tracking-[0.16em] text-emerald-300">LIFECYCLE</div>
            <h2 className="font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.08] tracking-tight">Graphic to glass in four moves.</h2>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[18px] border border-zinc-900 bg-zinc-900 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map(([n, title, body]) => (
              <div key={n} className="min-w-0 bg-panel px-[26px] pb-[34px] pt-[30px]">
                <div className="mb-6 font-mono text-xs text-emerald-300">{n}</div>
                <h3 className="mb-2.5 font-display text-[19px] font-bold tracking-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 overflow-hidden rounded-[20px] border border-zinc-800 bg-gradient-to-br from-emerald-300/10 to-indigo-500/[0.07] px-9 py-11 text-center">
            <h2 className="mb-3 font-display text-[clamp(26px,3.2vw,36px)] font-bold leading-tight tracking-tight">Every window on your block is inventory.</h2>
            <p className="mx-auto mb-6 max-w-[520px] text-base leading-relaxed text-zinc-400">Claim the screens, or claim the revenue. Both sides onboard in a single sitting.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/register" className="rounded-xl bg-gradient-to-b from-[#5cf0dd] to-[#26cdb9] px-6 py-3.5 text-[15px] font-bold text-brand-ink shadow-glow">Launch Your Ad Campaign</Link>
              <Link href="/register" className="rounded-xl border border-zinc-700 bg-white/[0.03] px-6 py-3.5 text-[15px] font-semibold text-zinc-100 hover:bg-white/5">Host a Screen &amp; Earn</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-9 px-6 pb-9 pt-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="h-[22px] w-[22px] rounded-md bg-gradient-to-br from-emerald-300 to-indigo-500" />
              <span className="font-display text-base font-bold tracking-tight">casteasy<span className="text-zinc-500">.io</span></span>
            </div>
            <p className="mb-3.5 max-w-[280px] text-[13px] leading-relaxed text-zinc-500">The hyper-local digital billboard marketplace. Merchant-approved screens, live in seconds.</p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-[#0c0e12] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span className="font-mono text-[11px] text-zinc-400">castez.io → casteasy.io</span>
            </div>
          </div>
          {[
            ["ADVERTISERS", ["Browse screens", "Creative specs", "Pricing by block"]],
            ["HOSTS", ["Apply a location", "Payouts & Stripe", "Approval controls"]],
            ["COMPANY", ["Network status", "Support", "Privacy"]],
          ].map(([heading, links]) => (
            <div key={heading as string} className="flex min-w-0 flex-col gap-2.5">
              <div className="mb-1 font-mono text-[11px] tracking-[0.14em] text-zinc-600">{heading as string}</div>
              {(links as string[]).map((l) => (
                <a key={l} href="#audiences" className="text-sm text-zinc-400 hover:text-zinc-100">{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-[#14171c]">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-5">
            <span className="text-xs text-zinc-600">© 2026 CastEZ, Inc. — casteasy.io. &ldquo;CastEZ&rdquo; and &ldquo;castez.io&rdquo; are branding of casteasy.io.</span>
            <span className="font-mono text-[11px] text-zinc-600">ALL SCREENS MERCHANT-APPROVED</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
