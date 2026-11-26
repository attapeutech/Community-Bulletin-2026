import { requireStoreOwner } from "@/lib/auth/session";
import { storeEarning } from "@/lib/store-earning";
import { loadCbRevenue } from "@/lib/cb-revenue";
import { CbBreakdown } from "@/components/admin/CbBreakdown";
import { db } from "@/lib/db/client";
import { locations, users, ownerEarnings, payouts } from "@/lib/db/schema";
import { eq, desc, ne, and } from "drizzle-orm";
import Link from "next/link";
import { MIN_PAYOUT_CENTS } from "@/types";
import PayoutDetailsForm from "./PayoutDetailsForm";
import DirectDepositCard from "./DirectDepositCard";
import { stripeConnectEnabled, stripeTestMode } from "@/lib/stripe";
import { directDepositStatus, syncConnectAccount } from "@/lib/direct-deposits";

const ACCENT = "#1A3A5C";

function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(cents / 100);
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FEF3C7", color: "#92400E", label: "Pending" },
  available: { bg: "#DBEAFE", color: "#1E40AF", label: "Available" },
  paid:      { bg: "#DCFCE7", color: "#166534", label: "Paid out" },
};

function Card({ label, value, sub, color = "var(--cb-ink)" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div style={{ background: "var(--cb-surface)", borderRadius: 12, border: "1px solid var(--cb-line)", padding: "16px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--cb-ink-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--cb-ink-3)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export default async function EarningsPage() {
  const session = await requireStoreOwner();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isAdmin = role === "admin";

  // Admin sees every owner's ledger; store owners see their own
  const whereClause = isAdmin
    ? ne(ownerEarnings.status, "void")
    : and(eq(ownerEarnings.ownerId, userId), ne(ownerEarnings.status, "void"));

  const rows = await db
    .select({
      id:           ownerEarnings.id,
      paymentId:    ownerEarnings.paymentId,
      adTitle:      ownerEarnings.adTitle,
      grossCents:   ownerEarnings.grossCents,
      feeCents:     ownerEarnings.feeCents,
      shareRateBps: ownerEarnings.shareRateBps,
      amountCents:  ownerEarnings.amountCents,
      currency:     ownerEarnings.currency,
      status:       ownerEarnings.status,
      availableAt:  ownerEarnings.availableAt,
      createdAt:    ownerEarnings.createdAt,
      locationName: locations.storeName,
      ownerName:    users.name,
    })
    .from(ownerEarnings)
    .innerJoin(locations, eq(ownerEarnings.locationId, locations.id))
    .innerJoin(users, eq(ownerEarnings.ownerId, users.id))
    .where(whereClause)
    .orderBy(desc(ownerEarnings.createdAt));

  // Admins also see Community Bulletin's side of each ad (never shown to store owners)
  const cbByPayment = isAdmin ? new Map((await loadCbRevenue()).map((r) => [r.paymentId, r])) : null;

  const payoutRows = await db
    .select({
      id: payouts.id, amountCents: payouts.amountCents, currency: payouts.currency,
      method: payouts.method, reference: payouts.reference, paidAt: payouts.paidAt, ownerName: users.name,
    })
    .from(payouts)
    .innerJoin(users, eq(payouts.ownerId, users.id))
    .where(isAdmin ? undefined : eq(payouts.ownerId, userId))
    .orderBy(desc(payouts.paidAt));

  const [me] = isAdmin ? [] : await db
    .select({
      payoutMethod: users.payoutMethod, payoutZelle: users.payoutZelle, payoutMailingAddress: users.payoutMailingAddress,
      stripeAccountId: users.stripeAccountId, stripePayoutsEnabled: users.stripePayoutsEnabled, manualPayoutAllowed: users.manualPayoutAllowed,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Direct deposit (Stripe Connect). Unfinished setups are re-checked with Stripe on each visit,
  // so returning from Stripe's signup shows the new status even before the webhook arrives.
  const connectEnabled = stripeConnectEnabled() && !isAdmin;
  if (connectEnabled && me?.stripeAccountId && !me.stripePayoutsEnabled) {
    try {
      me.stripePayoutsEnabled = (await syncConnectAccount(me.stripeAccountId)).stripePayoutsEnabled;
    } catch (err) {
      console.error("[earnings] Stripe account sync failed", err);
    }
  }
  const ddStatus = me ? directDepositStatus(me) : "not_set_up";
  // Zelle/check is the fallback only when direct deposit is off, or as an admin-approved exception
  const showManualDetails = !connectEnabled || !!me?.manualPayoutAllowed;

  // Pending: what they'll earn when the run ends (share less 2.9% + 30¢); available/paid: the amount released
  const estimate = (r: typeof rows[number]) => storeEarning(r.grossCents, r.shareRateBps).netCents;
  const pending   = rows.filter(r => r.status === "pending");
  const available = rows.filter(r => r.status === "available");
  const pendingCents   = pending.reduce((s, r) => s + estimate(r), 0);
  const availableCents = available.reduce((s, r) => s + (r.amountCents ?? 0), 0);
  const paidOutCents   = payoutRows.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "var(--cb-ink)" }}>
            {isAdmin ? "All Earnings" : "My Earnings"}
          </h1>
          <p style={{ color: "var(--cb-ink-2)", fontSize: 14, marginTop: 4 }}>
            Your share of ad revenue, after card processing fees.
          </p>
        </div>
        {isAdmin ? (
          <Link href="/dashboard/admin/payouts" style={{ fontSize: 13, color: "#fff", background: ACCENT, padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
            Manage Payouts →
          </Link>
        ) : (
          <Link href="/dashboard/store-owner" style={{ fontSize: 13, color: "var(--cb-ink-2)", textDecoration: "none" }}>
            ← Back to Locations
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24, marginTop: 20 }}>
        <Card label="Pending" value={`≈ ${formatCents(pendingCents)}`} sub={`${pending.length} ad run${pending.length !== 1 ? "s" : ""} in progress`} color="var(--cb-amber)" />
        <Card label="Available" value={formatCents(availableCents)} sub="included in the next payout" color="var(--cb-blue)" />
        <Card label="Paid Out" value={formatCents(paidOutCents)} sub={`${payoutRows.length} payout${payoutRows.length !== 1 ? "s" : ""}`} color="var(--cb-green)" />
        <Card label="Payout Schedule" value={connectEnabled ? "Monthly, 15th" : "Monthly"} sub={`minimum ${formatCents(MIN_PAYOUT_CENTS)}; smaller balances roll over`} />
      </div>

      {isAdmin && <AdminPayoutMinimumNote />}

      {/* How it works */}
      <div style={{ background: "var(--cb-surface-2)", border: "1px solid var(--cb-line)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--cb-ink-2)", marginBottom: 24, lineHeight: 1.6 }}>
        <strong style={{ color: "var(--cb-ink)" }}>How earnings work:</strong> when an advertiser pays for an ad at your store, it shows here as
        <strong> pending</strong>. Once the ad&apos;s run ends, it becomes <strong>available</strong>: your share
        (the percentage agreed for each location) of the ad price, less a card processing fee of 2.9% of your share + 30¢.
        For example, a $100 ad at 50%: $50.00 − $1.75 ($1.45 + $0.30) = <strong>$48.25</strong>. Sales tax the advertiser pays isn&apos;t part of the ad price. Available earnings are paid out monthly.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {connectEnabled && !me?.manualPayoutAllowed && (
          <DirectDepositCard status={ddStatus} testMode={stripeTestMode()} availableCents={availableCents} />
        )}

        {!isAdmin && showManualDetails && (
          <PayoutDetailsForm
            initialMethod={me?.payoutMethod ?? null}
            initialZelle={me?.payoutZelle ?? null}
            initialAddress={me?.payoutMailingAddress ?? null}
          />
        )}

        {/* Payout history */}
        {payoutRows.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "var(--cb-ink)", marginBottom: 12 }}>
              Payout History
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {payoutRows.map(p => (
                <div key={p.id} style={{ background: "var(--cb-surface)", borderRadius: 10, border: "1px solid var(--cb-line)", padding: "12px 16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cb-ink)" }}>
                      {new Date(p.paidAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                      {isAdmin && <span style={{ fontWeight: 400, color: "var(--cb-ink-2)" }}> · {p.ownerName}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cb-ink-2)", marginTop: 2 }}>
                      {p.method === "stripe" ? "Direct deposit" : p.method === "zelle" ? "Zelle" : "Check"}{p.reference && p.method !== "stripe" ? ` · ref ${p.reference}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cb-green)" }}>{formatCents(p.amountCents, p.currency)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ledger */}
        <div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "var(--cb-ink)", marginBottom: 12 }}>
            Earnings by Ad
          </h2>
          {rows.length === 0 ? (
            <div style={{ background: "var(--cb-surface)", borderRadius: 12, border: "1px solid var(--cb-line)", padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
              <h3 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "var(--cb-ink)", marginBottom: 8 }}>No earnings yet</h3>
              <p style={{ color: "var(--cb-ink-2)", fontSize: 14 }}>Earnings will appear here once advertisers pay for ads at your locations.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.map(r => {
                const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                const rate = `${r.shareRateBps / 100}%`;
                return (
                  <div key={r.id} style={{ background: "var(--cb-surface)", borderRadius: 10, border: "1px solid var(--cb-line)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--cb-ink)" }}>{r.adTitle}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--cb-ink-3)", marginTop: 4 }}>
                        {r.locationName}{isAdmin && ` · ${r.ownerName}`} · paid {new Date(r.createdAt).toLocaleDateString()}
                        {r.status === "pending" && r.availableAt && ` · available ${new Date(r.availableAt).toLocaleDateString()}`}
                        {r.status === "pending" && !r.availableAt && " · awaiting ad approval"}
                      </div>
                    </div>
                    <EarningBreakdown row={r} rate={rate} />
                    {(() => {
                      const cb = r.paymentId ? cbByPayment?.get(r.paymentId) : undefined;
                      if (!cb) return null;
                      return (
                        <div style={{ flex: "0 1 280px", minWidth: 230, background: "#F4F9F5", border: "1px solid #CFE6D6", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#15803D", marginBottom: 4 }}>Community Bulletin · admin only</div>
                          <CbBreakdown ad={cb} cb={cb.cb} />
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Admins only: what "minimum $25; smaller balances roll over" means (for the sales team's questions).
// Keep in sync with MIN_PAYOUT_CENTS in src/types and the monthly payout job.
function AdminPayoutMinimumNote() {
  const min = formatCents(MIN_PAYOUT_CENTS);
  return (
    <details style={{ background: "var(--cb-surface-2)", border: "1px solid var(--cb-line)", borderRadius: 12, padding: "12px 18px", marginBottom: 24, fontSize: 13, color: "var(--cb-ink-2)", lineHeight: 1.6 }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--cb-ink)", fontSize: 14 }}>
        📝 Admin notes: the {min} payout minimum
      </summary>
      <p style={{ margin: "10px 0 6px" }}>
        <strong style={{ color: "var(--cb-ink)" }}>{min} is the smallest payout we send a store owner.</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
        <li>Payouts go out <strong>once a month</strong>, on the 15th, by direct deposit.</li>
        <li>An owner with <strong>{min} or more available</strong> is paid their <strong>full balance</strong>.</li>
        <li>An owner with <strong>less than {min}</strong> gets nothing that month. The money <strong>isn&apos;t lost</strong>: it stays in their balance, adds to next month&apos;s earnings, and is paid in full once it reaches {min}.</li>
      </ul>
      <p style={{ margin: "10px 0 6px" }}>
        <strong style={{ color: "var(--cb-ink)" }}>Example:</strong> a store earns $18 one month, so no payout on the 15th. The next month it earns another $30.
        The balance is now $48, so they&apos;re paid <strong>$48</strong>.
      </p>
      <p style={{ margin: "6px 0 0" }}>
        <strong style={{ color: "var(--cb-ink)" }}>Why a minimum?</strong> It avoids lots of tiny bank deposits that each take effort to track and can
        cost more to handle than they&apos;re worth. {min} is a common threshold. It&apos;s one setting (<code>MIN_PAYOUT_CENTS</code>), so it can be
        lowered, raised or removed.
      </p>
    </details>
  );
}

/**
 * One ad's earnings, as the owner would work it out:
 *   $50.00  Your 50% share of the $100.00 ad
 * − $1.75   Card fee  $1.45 (2.9%) + $0.30
 *   $48.25  You earn
 * Earnings released before this formula (Nov 26, 2026) show their recorded fee as one amount.
 */
function EarningBreakdown({ row: r, rate }: {
  row: { grossCents: number; shareRateBps: number; amountCents: number | null; status: string; currency: string };
  rate: string;
}) {
  const e = storeEarning(r.grossCents, r.shareRateBps);
  const released = r.amountCents !== null;
  const net = released ? r.amountCents! : e.netCents;
  const fee = e.shareCents - net;
  const split = !released || r.amountCents === e.netCents;   // the 2.9% + 30¢ formula applies
  const m = (c: number) => formatCents(c, r.currency);
  const line = { display: "flex", justifyContent: "space-between", gap: 14, fontSize: 12, color: "var(--cb-ink-2)" } as const;
  return (
    <div style={{ flex: "0 1 280px", minWidth: 220, fontVariantNumeric: "tabular-nums" }}>
      <div style={line}>
        <span>Your {rate} share of the {m(r.grossCents)} ad</span>
        <span style={{ color: "var(--cb-ink)", fontWeight: 600 }}>{m(e.shareCents)}</span>
      </div>
      <div style={line}>
        <span>− Card fee</span>
        <span style={{ whiteSpace: "nowrap" }}>−{m(fee)}</span>
      </div>
      {split && <div style={{ fontSize: 11, color: "var(--cb-ink-3)", paddingLeft: 10 }}>{m(e.percentFeeCents)} (2.9%) + {m(e.fixedFeeCents)}</div>}
      <div style={{ ...line, borderTop: "1px solid var(--cb-line)", marginTop: 4, paddingTop: 4, fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: "var(--cb-ink)" }}>{r.status === "void" ? "Not earned (refunded)" : released ? "You earn" : "You'll earn"}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: r.status === "void" ? "var(--cb-ink-3)" : "var(--cb-green)", textDecoration: r.status === "void" ? "line-through" : "none" }}>{m(net)}</span>
      </div>
    </div>
  );
}
