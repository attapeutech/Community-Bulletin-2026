import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { payments } from "@/lib/db/schema";
import { loadCbRevenue, paymentMonth, sumCbRevenue } from "@/lib/cb-revenue";
import { CbBreakdown } from "@/components/admin/CbBreakdown";
import OfflinePaid from "./OfflinePaid";

export const dynamic = "force-dynamic";

const money = (c: number) => `${c < 0 ? "−" : ""}$${(Math.abs(c) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthLabel = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

function currentMonth() {
  const pt = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return `${pt.getFullYear()}-${String(pt.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminRevenuePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requireAdmin();
  const asked = (await searchParams).m;
  const month = asked === "all" ? "all" : asked && /^\d{4}-\d{2}$/.test(asked) ? asked : currentMonth();

  const rows = await loadCbRevenue(month === "all" ? undefined : eq(paymentMonth, month));
  const t = sumCbRevenue(rows);
  const months = (await db.selectDistinct({ m: paymentMonth }).from(payments).where(eq(payments.status, "paid"))).map((r) => r.m);
  const allMonths = [...new Set([currentMonth(), ...(month === "all" ? [] : [month]), ...months])].sort().reverse();

  const th = "text-left text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82] py-2 px-2 border-b border-[#D8E4EE] whitespace-nowrap";
  const td = "py-2.5 px-2 border-b border-[#EEF3F8] align-top text-[13px] text-[#1A3A5C]";
  const pill = (active: boolean) => `no-underline text-[12px] font-semibold px-3 py-1.5 rounded-full border ${active ? "bg-[#1A3A5C] text-white border-[#1A3A5C]" : "bg-white text-[#1A3A5C] border-[#C9D8E6] hover:bg-[#F0F5FA]"}`;

  const cards = [
    { label: "Ad sales (before tax)", value: money(t.adSalesCents), sub: `${t.count} paid ad${t.count === 1 ? "" : "s"}` },
    { label: "Sales tax collected", value: money(t.taxCents), sub: "owed to WA" },
    { label: "Store owners earn", value: money(t.storeNetCents), sub: "after their card fee" },
    { label: "Stripe fees (our part)", value: money(t.ourFeeCents), sub: `${money(t.stripeFeeCents)} Stripe charged in all` },
    { label: "CB keeps", value: money(t.keepsCents), sub: t.estimated ? "some Stripe fees estimated" : "after Stripe, store shares and tax", accent: true },
  ];

  return (
    <div className="max-w-[1100px]">
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Revenue</h1>
      <p className="text-sm text-[#4A6B82] mb-4">
        What Community Bulletin keeps from each paid ad: our part of the ad price, plus the sales tax collected, less our part of
        Stripe&apos;s fee (Stripe charges 30¢ once per payment, and the store&apos;s card fee covers it), less the tax owed to WA.
        Refunded ads are left out. Payout costs (Stripe Connect) aren&apos;t included.
      </p>

      <HowToRead />

      <div className="flex flex-wrap gap-1.5 mb-5">
        {allMonths.map((mo) => <Link key={mo} href={`/dashboard/admin/revenue?m=${mo}`} className={pill(mo === month)}>{monthLabel(mo)}</Link>)}
        <Link href="/dashboard/admin/revenue?m=all" className={pill(month === "all")}>All time</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.accent ? "bg-green-50 border-green-200" : "bg-white border-[#D8E4EE]"}`}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82]">{c.label}</div>
            <div className={`text-[20px] font-bold mt-1 ${c.accent ? "text-green-800" : "text-[#1A3A5C]"}`}>{c.value}</div>
            <div className="text-[11px] text-[#4A6B82] mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#D8E4EE] rounded-xl p-5">
        {rows.length === 0 ? (
          <p className="text-[13px] text-[#4A6B82] py-4">No paid ads {month === "all" ? "yet" : `in ${monthLabel(month)}`}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr>
                  <th className={th}>Paid</th>
                  <th className={th}>Ad · store</th>
                  <th className={th}>Store owner earns</th>
                  <th className={th}>Community Bulletin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.paymentId}>
                    <td className={`${td} whitespace-nowrap text-[12px] text-[#4A6B82]`}>{new Date(r.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })}</td>
                    <td className={td}>
                      <Link href={`/dashboard/user/ads/${r.adId}`} className="font-semibold text-[#1A3A5C] no-underline hover:text-[#E8563A]">{r.adTitle}</Link>
                      <div className="text-[12px] text-[#4A6B82]">📍 {r.storeName.trim()}{r.storeNumber ? ` #${r.storeNumber.replace(/^#/, "")}` : ""}</div>
                      <div className="text-[12px] text-[#4A6B82]">Paid {money(r.adPriceCents + r.taxCents)}{r.taxCents > 0 && ` (${money(r.adPriceCents)} + ${money(r.taxCents)} tax)`}</div>
                    </td>
                    <td className={`${td} text-[12px]`}>
                      {r.storeStatus ? (
                        <>
                          <div className="font-semibold">{money(r.storeNetCents)}</div>
                          <div className="text-[#4A6B82]">{r.shareRateBps / 100}% = {money(r.storeShareCents)} − {money(r.storeFeeCents)} fee</div>
                          <div className="text-[11px] text-[#7C93A8]">{r.storeStatus === "pending" ? "pending (run not finished)" : r.storeStatus}</div>
                        </>
                      ) : (
                        // No share in the system (our store, or paid before the owner had an account): record what was paid outside it
                        <OfflinePaid paymentId={r.paymentId} adPriceCents={r.adPriceCents} offline={r.offline} ownStore={r.ownStore} />
                      )}
                    </td>
                    <td className={td}><CbBreakdown ad={r} cb={r.cb} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Worked example for partners: one $100 ad at a 50% store in Marysville (9.4% tax) */
function HowToRead() {
  const line = "flex justify-between gap-6";
  const total = `${line} border-t border-[#D8E4EE] mt-1 pt-1 font-semibold text-[#1A3A5C]`;
  return (
    <details open className="bg-[#F4F7FB] border border-[#D8E4EE] rounded-xl px-5 py-4 mb-5 text-[13px] text-[#4A6B82] leading-relaxed">
      <summary className="cursor-pointer font-bold text-[#1A3A5C] text-[14px]">How to read this page: one $100 ad, step by step</summary>
      <p className="mt-3 mb-3">
        An advertiser pays for a $100 ad at a store that earns a 50% share, in Marysville (9.4% sales tax). They pay
        <b className="text-[#1A3A5C]"> $109.40</b>, and Stripe charges <b className="text-[#1A3A5C]">$3.47</b> (2.9% of $109.40 + 30¢).
      </p>
      <div className="grid gap-4 md:grid-cols-2 mb-3">
        <div className="bg-white border border-[#D8E4EE] rounded-lg px-4 py-3 tabular-nums">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#4A6B82] mb-1.5">Store owner</div>
          <div className={line}><span>50% share of the $100 ad</span><span className="text-[#1A3A5C]">$50.00</span></div>
          <div className={line}><span>− Card fee ($1.45 = 2.9%, + $0.30)</span><span>−$1.75</span></div>
          <div className={total}><span>Store owner earns</span><span className="text-green-700">$48.25</span></div>
        </div>
        <div className="bg-white border border-[#D8E4EE] rounded-lg px-4 py-3 tabular-nums">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#4A6B82] mb-1.5">Community Bulletin</div>
          <div className={line}><span>Our 50% of the $100 ad</span><span className="text-[#1A3A5C]">$50.00</span></div>
          <div className={line}><span>+ Sales tax collected (9.4%)</span><span>$9.40</span></div>
          <div className={total}><span>Subtotal</span><span>$59.40</span></div>
          <div className={line}><span>− Stripe fee, our part ($3.47 − $1.75 store&apos;s part)</span><span>−$1.72</span></div>
          <div className={total}><span>After Stripe</span><span>$57.68</span></div>
          <div className={line}><span>− Sales tax owed to WA</span><span>−$9.40</span></div>
          <div className={total}><span>CB keeps</span><span className="text-green-700">$48.28</span></div>
        </div>
      </div>
      <p className="font-semibold text-[#1A3A5C] mb-1">It adds up to what Stripe actually deposits</p>
      <p className="mb-3 tabular-nums">
        $109.40 paid − $3.47 Stripe fee = <b className="text-[#1A3A5C]">$105.93</b> deposited
        = $48.25 store owner + $9.40 sales tax + $48.28 CB.
      </p>
      <ul className="list-disc pl-5 m-0 flex flex-col gap-1">
        <li><b className="text-[#1A3A5C]">Why our Stripe part has no 30¢:</b> Stripe charges its 30¢ once per payment, and the store owner&apos;s card fee already covers it.</li>
        <li><b className="text-[#1A3A5C]">Sales tax isn&apos;t ours:</b> we collect it for Washington and pay it with the excise tax return (see Sales Tax). It&apos;s shown coming in and going out so the totals match the bank.</li>
        <li><b className="text-[#1A3A5C]">Our own stores</b> (no store owner share): CB keeps the whole ad price, less Stripe&apos;s full fee.</li>
        <li><b className="text-[#1A3A5C]">Paid outside the system:</b> if a store owner was paid in cash, Zelle or check (for example before their store had its own account), use &ldquo;Record cash payment&rdquo; on that ad. It counts as the store&apos;s share, and CB pays the whole Stripe fee since no card fee was taken from it.</li>
        <li><b className="text-[#1A3A5C]">&ldquo;est.&rdquo;</b> means Stripe&apos;s real fee isn&apos;t recorded yet, so 2.9% + 30¢ is shown. The real fee is filled in automatically (when paid, or by the daily job). Amex and foreign cards can cost a little more.</li>
        <li><b className="text-[#1A3A5C]">Not included:</b> payout costs for direct deposits (Stripe Connect: 0.25% + 25¢ per payout, and $2 a month per store owner paid that month), which are charged per monthly payout, not per ad.</li>
      </ul>
    </details>
  );
}
