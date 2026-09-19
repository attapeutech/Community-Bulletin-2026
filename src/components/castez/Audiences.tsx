"use client";

import Link from "next/link";
import { useState } from "react";

type Tab = "advertisers" | "hosts";

const CARD = "min-w-0 rounded-[18px] border border-ce-line3 bg-ce-surface/60 p-[30px]";
const EYEBROW = "mb-4 font-ce-mono text-[11px] tracking-[0.14em] text-ce-muted4";
const H3 = "m-0 mb-2.5 font-ce-display text-xl font-bold tracking-[-0.03em]";
const BODY = "m-0 text-[15px] leading-[1.6] text-ce-muted";

function Card({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className={CARD}>
      <div className={EYEBROW}>{eyebrow}</div>
      <h3 className={H3}>{title}</h3>
      <p className={BODY}>{body}</p>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[9px] px-[18px] py-2.5 font-ce-body text-sm font-bold transition-all duration-[180ms] ${
        active ? "text-ce-onAccent" : "text-ce-muted2 hover:text-ce-text4"
      }`}
      style={
        active
          ? {
              background: "linear-gradient(180deg,#5cf0dd,#2ad3bf)",
              boxShadow: "0 6px 20px -6px rgba(62,230,209,.6)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

export function Audiences({ defaultTab = "advertisers" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <section id="audiences" className="scroll-mt-[68px] border-b border-ce-line">
      <div className="mx-auto max-w-[1200px] px-6 py-[84px]">
        <div className="mb-[34px] flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[620px]">
            <div className="mb-3.5 font-ce-mono text-[11px] tracking-[0.16em] text-ce-accent">
              TWO SIDES, ONE MARKETPLACE
            </div>
            <h2 className="m-0 font-ce-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.08] tracking-[-0.04em]">
              Built for the business buying the window — and the one that owns it.
            </h2>
          </div>

          <div className="inline-flex rounded-xl border border-ce-line4 bg-ce-panel p-1">
            <ToggleButton active={tab === "advertisers"} onClick={() => setTab("advertisers")}>
              For Advertisers
            </ToggleButton>
            <ToggleButton active={tab === "hosts"} onClick={() => setTab("hosts")}>
              For Host Locations
            </ToggleButton>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 min-[720px]:grid-cols-2">
          {tab === "advertisers" ? (
            <>
              <div className="min-w-0 rounded-[18px] border border-ce-line3 bg-[linear-gradient(160deg,rgba(62,230,209,.09),rgba(13,15,19,.5))] p-[30px] backdrop-blur-[14px] min-[720px]:col-span-2">
                <div className="mb-4 font-ce-mono text-[11px] tracking-[0.14em] text-ce-accent">
                  HYPER-LOCAL TARGETING
                </div>
                <h3 className="m-0 mb-3 font-ce-display text-[26px] font-bold leading-[1.15] tracking-[-0.035em]">
                  Buy the exact corner your customers walk past.
                </h3>
                <p className="m-0 mb-5 max-w-[520px] text-[15px] leading-[1.6] text-ce-muted">
                  Browse screens by neighborhood, foot traffic and store type. Book one window for a
                  weekend special or forty across a metro — priced per screen, per day, no
                  agency in the middle.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Convenience stores", "Laundromats", "Barber shops", "Cafés"].map((c) => (
                    <span
                      key={c}
                      className="rounded-lg border border-ce-line4 bg-ce-surface px-3 py-[7px] text-[13px] text-ce-text4"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <Card
                eyebrow="ZERO PRINT FRICTION"
                title="Drop a PNG. That’s the whole workflow."
                body="No designer retainer, no 500-flyer minimum, no walking a stack of paper down the block asking for counter space."
              />
              <Card
                eyebrow="INSTANT LIVE EDITS"
                title="Change the price at 2pm, it’s on glass by 2:01."
                body="Swap creative, pause a slow block or push a flash offer — every screen updates over a live socket, not a print run."
              />

              <div className={`${CARD} flex flex-col justify-between gap-5 min-[720px]:col-span-2`}>
                <div>
                  <div className={EYEBROW}>TRANSPARENT BILLING</div>
                  <h3 className={H3}>Card in, campaign out.</h3>
                  <p className={BODY}>
                    Stripe checkout, itemized by screen and day. Cancel a block and the unused days
                    come back.
                  </p>
                </div>
                <Link
                  href="#flow"
                  className="text-sm font-bold text-ce-accent hover:text-ce-accentLight"
                >
                  See the 4-step flow →
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0 rounded-[18px] border border-ce-line3 bg-[linear-gradient(160deg,rgba(79,124,255,.11),rgba(13,15,19,.5))] p-[30px] backdrop-blur-[14px] min-[720px]:col-span-2">
                <div className="mb-4 font-ce-mono text-[11px] tracking-[0.14em] text-ce-blueLight">
                  PASSIVE REVENUE VIA STRIPE
                </div>
                <h3 className="m-0 mb-3 font-ce-display text-[26px] font-bold leading-[1.15] tracking-[-0.035em]">
                  Your window is already the best-trafficked ad space on the block.
                </h3>
                <p className="m-0 mb-5 max-w-[520px] text-[15px] leading-[1.6] text-ce-muted">
                  Every booked slot pays out to your bank on a Stripe Connect schedule you control.
                  No invoicing advertisers, no chasing checks, no negotiating with the guy who wants
                  to tape a flyer to your door.
                </p>
                <div className="flex flex-wrap gap-3.5">
                  {[
                    { value: "Weekly", caption: "automatic payouts" },
                    { value: "Per-slot", caption: "revenue share, itemized" },
                  ].map((s) => (
                    <div
                      key={s.value}
                      className="rounded-xl border border-ce-line4 bg-ce-surface px-[18px] py-3.5"
                    >
                      <div className="font-ce-display text-[22px] font-bold tracking-[-0.03em]">
                        {s.value}
                      </div>
                      <div className="text-xs text-ce-muted3">{s.caption}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Card
                eyebrow="AUTOMATED QUEUE CONTROL"
                title="Nothing hits your glass without your tap."
                body="Review every creative in one queue. Approve, reject, or block a category — competitors stay off your window permanently."
              />
              <Card
                eyebrow="FREE HARDWARE PLACEMENT"
                title="We ship the screen. You plug it in."
                body="Commercial panel, mount and media stick at no cost. One outlet, one Wi-Fi code, and the window runs itself."
              />

              <div className={`${CARD} flex flex-col justify-between gap-5 min-[720px]:col-span-2`}>
                <div>
                  <div className={EYEBROW}>CLUTTER, GONE</div>
                  <h3 className={H3}>Clear the tape and the sun-bleached paper.</h3>
                  <p className={BODY}>
                    One clean panel replaces a decade of flyers — and it earns.
                  </p>
                </div>
                <Link
                  href="#flow"
                  className="text-sm font-bold text-ce-blueLight hover:text-ce-text4"
                >
                  Apply as a host location →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
