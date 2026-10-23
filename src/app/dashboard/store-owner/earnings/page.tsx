import { requireStoreOwner } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations, users, ownerEarnings, payouts } from "@/lib/db/schema";
import { eq, desc, ne, and } from "drizzle-orm";
import Link from "next/link";
import { MIN_PAYOUT_CENTS } from "@/types";
import PayoutDetailsForm from "./PayoutDetailsForm";

const ACCENT = "#1A3A5C";

function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(cents / 100);
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FEF3C7", color: "#92400E", label: "Pending" },
  available: { bg: "#DBEAFE", color: "#1E40AF", label: "Available" },
  paid:      { bg: "#DCFCE7", color: "#166534", label: "Paid out" },
};

function Card({ label, value, sub, color = ACCENT }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "16px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#4A6B82", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 2 }}>{sub}</div>
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
    .select({ payoutMethod: users.payoutMethod, payoutZelle: users.payoutZelle, payoutMailingAddress: users.payoutMailingAddress })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Pending amounts are estimates until the run ends and the processor fee is known
  const estimate = (r: typeof rows[number]) => Math.round((r.grossCents * r.shareRateBps) / 10000);
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
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT }}>
            {isAdmin ? "All Earnings" : "My Earnings"}
          </h1>
          <p style={{ color: "#4A6B82", fontSize: 14, marginTop: 4 }}>
            Your share of ad revenue, after card processing fees.
          </p>
        </div>
        {isAdmin ? (
          <Link href="/dashboard/admin/payouts" style={{ fontSize: 13, color: "#fff", background: ACCENT, padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
            Manage Payouts →
          </Link>
        ) : (
          <Link href="/dashboard/store-owner" style={{ fontSize: 13, color: "#4A6B82", textDecoration: "none" }}>
            ← Back to Locations
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24, marginTop: 20 }}>
        <Card label="Pending" value={`≈ ${formatCents(pendingCents)}`} sub={`${pending.length} ad run${pending.length !== 1 ? "s" : ""} in progress`} color="#92400E" />
        <Card label="Available" value={formatCents(availableCents)} sub="included in the next payout" color="#1E40AF" />
        <Card label="Paid Out" value={formatCents(paidOutCents)} sub={`${payoutRows.length} payout${payoutRows.length !== 1 ? "s" : ""}`} color="#166534" />
        <Card label="Payout Schedule" value="Monthly" sub={`minimum ${formatCents(MIN_PAYOUT_CENTS)}; smaller balances roll over`} />
      </div>

      {/* How it works */}
      <div style={{ background: "#F7F9FC", border: "1px solid #D8E4EE", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#4A6B82", marginBottom: 24, lineHeight: 1.6 }}>
        <strong style={{ color: ACCENT }}>How earnings work:</strong> when an advertiser pays for an ad at your store, it shows here as
        <strong> pending</strong>. Once the ad&apos;s run ends, it becomes <strong>available</strong>: your share
        (25%, or 50% if you provided the screen) of the ad price after card processing fees. Available earnings are paid out monthly.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {!isAdmin && (
          <PayoutDetailsForm
            initialMethod={me?.payoutMethod ?? null}
            initialZelle={me?.payoutZelle ?? null}
            initialAddress={me?.payoutMailingAddress ?? null}
          />
        )}

        {/* Payout history */}
        {payoutRows.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>
              Payout History
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {payoutRows.map(p => (
                <div key={p.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #D8E4EE", padding: "12px 16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>
                      {new Date(p.paidAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                      {isAdmin && <span style={{ fontWeight: 400, color: "#4A6B82" }}> · {p.ownerName}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#4A6B82", marginTop: 2 }}>
                      {p.method === "zelle" ? "Zelle" : "Check"}{p.reference ? ` · ref ${p.reference}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#166534" }}>{formatCents(p.amountCents, p.currency)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ledger */}
        <div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>
            Earnings by Ad
          </h2>
          {rows.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
              <h3 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, marginBottom: 8 }}>No earnings yet</h3>
              <p style={{ color: "#4A6B82", fontSize: 14 }}>Earnings will appear here once advertisers pay for ads at your locations.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.map(r => {
                const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                const rate = `${r.shareRateBps / 100}%`;
                return (
                  <div key={r.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #D8E4EE", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>{r.adTitle}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 4 }}>
                        {r.locationName}{isAdmin && ` · ${r.ownerName}`} · paid {new Date(r.createdAt).toLocaleDateString()}
                        {r.status === "pending" && r.availableAt && ` · available ${new Date(r.availableAt).toLocaleDateString()}`}
                        {r.status === "pending" && !r.availableAt && " · awaiting ad approval"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "#4A6B82", marginBottom: 2 }}>
                        Ad price: <span style={{ fontWeight: 600, color: ACCENT }}>{formatCents(r.grossCents, r.currency)}</span>
                        {r.feeCents !== null && <> · fee {formatCents(r.feeCents, r.currency)}</>}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#166534" }}>
                        {r.amountCents !== null ? formatCents(r.amountCents, r.currency) : `≈ ${formatCents(estimate(r), r.currency)}`}
                      </div>
                      <div style={{ fontSize: 10, color: "#5B7D96" }}>
                        {r.amountCents !== null ? `your ${rate} share` : `your ${rate} share, before fees`}
                      </div>
                    </div>
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
