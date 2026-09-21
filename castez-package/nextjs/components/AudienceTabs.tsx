"use client";

import { useState } from "react";

const CARD = "min-w-0 rounded-[18px] border border-hairline bg-[#0d0f13]/60 p-[30px]";
const KICKER = "mb-4 font-mono text-[11px] tracking-[0.14em] text-zinc-500";
const H3 = "mb-2.5 font-display text-xl font-bold tracking-tight";
const BODY = "text-[15px] leading-relaxed text-zinc-400";

export default function AudienceTabs({ defaultTab = "advertisers" as "advertisers" | "hosts" }) {
  const [tab, setTab] = useState(defaultTab);

  const tabClass = (active: boolean) =>
    `rounded-[9px] px-[18px] py-2.5 text-sm font-bold transition ${
      active
        ? "bg-gradient-to-b from-[#5cf0dd] to-[#2ad3bf] text-brand-ink shadow-[0_6px_20px_-6px_rgba(62,230,209,0.6)]"
        : "text-zinc-400 hover:text-zinc-200"
    }`;

  return (
    <section id="audiences" className="border-b border-[#14171c]">
      <div className="mx-auto max-w-[1200px] px-6 py-[84px]">
        <div className="mb-[34px] flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[620px]">
            <div className="mb-3.5 font-mono text-[11px] tracking-[0.16em] text-emerald-300">TWO SIDES, ONE MARKETPLACE</div>
            <h2 className="font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.08] tracking-tight">
              Built for the business buying the window — and the one that owns it.
            </h2>
          </div>
          <div className="inline-flex rounded-xl border border-zinc-800 bg-[#0c0e12] p-1">
            <button type="button" onClick={() => setTab("advertisers")} className={tabClass(tab === "advertisers")}>For Advertisers</button>
            <button type="button" onClick={() => setTab("hosts")} className={tabClass(tab === "hosts")}>For Host Locations</button>
          </div>
        </div>

        {tab === "advertisers" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-1 min-w-0 rounded-[18px] border border-hairline bg-gradient-to-br from-emerald-300/[0.09] to-[#0d0f13]/50 p-[30px] backdrop-blur-md sm:col-span-2">
              <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-emerald-300">HYPER-LOCAL TARGETING</div>
              <h3 className="mb-3 font-display text-[26px] font-bold leading-tight tracking-tight">Buy the exact corner your customers walk past.</h3>
              <p className={`mb-5 max-w-[520px] ${BODY}`}>
                Browse screens by neighborhood, foot traffic and store type. Book one window for a weekend special or forty across a metro — priced per screen, per day, no agency in the middle.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Convenience stores", "Laundromats", "Barber shops", "Cafés"].map((t) => (
                  <span key={t} className="rounded-lg border border-zinc-800 bg-panel px-3 py-1.5 text-[13px] text-zinc-300">{t}</span>
                ))}
              </div>
            </div>
            <div className={CARD}>
              <div className={KICKER}>ZERO PRINT FRICTION</div>
              <h3 className={H3}>Drop a PNG. That's the whole workflow.</h3>
              <p className={BODY}>No designer retainer, no 500-flyer minimum, no walking a stack of paper down the block asking for counter space.</p>
            </div>
            <div className={CARD}>
              <div className={KICKER}>INSTANT LIVE EDITS</div>
              <h3 className={H3}>Change the price at 2pm, it's on glass by 2:01.</h3>
              <p className={BODY}>Swap creative, pause a slow block or push a flash offer — every screen updates over a live socket, not a print run.</p>
            </div>
            <div className={`${CARD} flex flex-col justify-between gap-5 sm:col-span-2`}>
              <div>
                <div className={KICKER}>TRANSPARENT BILLING</div>
                <h3 className={H3}>Card in, campaign out.</h3>
                <p className={BODY}>Stripe checkout, itemized by screen and day. Cancel a block and the unused days come back.</p>
              </div>
              <a href="#flow" className="text-sm font-bold">See the 4-step flow →</a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-1 min-w-0 rounded-[18px] border border-hairline bg-gradient-to-br from-indigo-500/[0.11] to-[#0d0f13]/50 p-[30px] backdrop-blur-md sm:col-span-2">
              <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-[#9db0ff]">PASSIVE REVENUE VIA STRIPE</div>
              <h3 className="mb-3 font-display text-[26px] font-bold leading-tight tracking-tight">Your window is already the best-trafficked ad space on the block.</h3>
              <p className={`mb-5 max-w-[520px] ${BODY}`}>
                Every booked slot pays out to your bank on a Stripe Connect schedule you control. No invoicing advertisers, no chasing checks, no negotiating with the guy who wants to tape a flyer to your door.
              </p>
              <div className="flex flex-wrap gap-3.5">
                {[["Weekly", "automatic payouts"], ["Per-slot", "revenue share, itemized"]].map(([big, small]) => (
                  <div key={big} className="rounded-xl border border-zinc-800 bg-panel px-[18px] py-3.5">
                    <div className="font-display text-[22px] font-bold tracking-tight">{big}</div>
                    <div className="text-xs text-zinc-500">{small}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={CARD}>
              <div className={KICKER}>AUTOMATED QUEUE CONTROL</div>
              <h3 className={H3}>Nothing hits your glass without your tap.</h3>
              <p className={BODY}>Review every creative in one queue. Approve, reject, or block a category — competitors stay off your window permanently.</p>
            </div>
            <div className={CARD}>
              <div className={KICKER}>FREE HARDWARE PLACEMENT</div>
              <h3 className={H3}>We ship the screen. You plug it in.</h3>
              <p className={BODY}>Commercial panel, mount and media stick at no cost. One outlet, one Wi-Fi code, and the window runs itself.</p>
            </div>
            <div className={`${CARD} flex flex-col justify-between gap-5 sm:col-span-2`}>
              <div>
                <div className={KICKER}>CLUTTER, GONE</div>
                <h3 className={H3}>Clear the tape and the sun-bleached paper.</h3>
                <p className={BODY}>One clean panel replaces a decade of flyers — and it earns.</p>
              </div>
              <a href="#flow" className="text-sm font-bold text-[#9db0ff] hover:text-[#b9c7ff]">Apply as a host location →</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
