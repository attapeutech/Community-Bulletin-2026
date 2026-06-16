import { requireStoreOwner } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations, ads, payments, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";

const ACCENT = "#1A3A5C";

function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(cents / 100);
}

export default async function EarningsPage() {
  const session = await requireStoreOwner();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isAdmin = role === "admin";

  // Build where clause — admin sees all, store_owner sees own locations only
  const whereClause = isAdmin
    ? eq(payments.status, "paid")
    : and(eq(locations.storeOwnerId, userId), eq(payments.status, "paid"));

  const rows = await db
    .select({
      paymentId:         payments.id,
      amountCents:       payments.amountCents,
      currency:          payments.currency,
      paymentCreatedAt:  payments.createdAt,
      adTitle:           ads.title,
      adStartedAt:       ads.startedAt,
      adEndedAt:         ads.endedAt,
      locationId:        locations.id,
      locationName:      locations.storeName,
      locationSlug:      locations.slug,
      equipmentProvided: locations.equipmentProvided,
      advertiserName:    users.name,
    })
    .from(payments)
    .innerJoin(ads,       eq(payments.adId,  ads.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(users,     eq(payments.userId, users.id))
    .where(whereClause)
    .orderBy(desc(payments.createdAt));

  // Compute totals
  const totalRevenueCents = rows.reduce((s, r) => s + r.amountCents, 0);
  const totalEarningsCents = rows.reduce((s, r) => {
    const rate = r.equipmentProvided ? 0.5 : 0.25;
    return s + Math.round(r.amountCents * rate);
  }, 0);

  // Group by location
  const byLocation = new Map<string, {
    name: string; slug: string; equipmentProvided: boolean;
    revenueCents: number; earningsCents: number; count: number;
  }>();
  for (const r of rows) {
    const entry = byLocation.get(r.locationId) ?? {
      name: r.locationName, slug: r.locationSlug,
      equipmentProvided: r.equipmentProvided,
      revenueCents: 0, earningsCents: 0, count: 0,
    };
    const rate = r.equipmentProvided ? 0.5 : 0.25;
    entry.revenueCents  += r.amountCents;
    entry.earningsCents += Math.round(r.amountCents * rate);
    entry.count         += 1;
    byLocation.set(r.locationId, entry);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT }}>
            {isAdmin ? "All Earnings" : "My Earnings"}
          </h1>
          <p style={{ color: "#4A6B82", fontSize: 14, marginTop: 4 }}>
            Revenue from paid ads across {byLocation.size > 0 ? byLocation.size : "your"} location{byLocation.size !== 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          href="/dashboard/store-owner"
          style={{ fontSize: 13, color: "#4A6B82", textDecoration: "none" }}
        >
          ← Back to Locations
        </Link>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28, marginTop: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#4A6B82", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Total Ad Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>{formatCents(totalRevenueCents)}</div>
          <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 2 }}>gross from advertisers</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#4A6B82", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Your Earnings</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#166534" }}>{formatCents(totalEarningsCents)}</div>
          <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 2 }}>your revenue share</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#4A6B82", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Paid Ads</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>{rows.length}</div>
          <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 2 }}>completed payments</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#4A6B82", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Payout Status</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#92400E" }}>Pending</div>
          <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 2 }}>payouts processed manually</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, marginBottom: 8 }}>No earnings yet</h2>
          <p style={{ color: "#4A6B82", fontSize: 14 }}>Earnings will appear here once advertisers pay for ads at your locations.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Per-location summary */}
          {byLocation.size > 1 && (
            <div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>
                By Location
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                {Array.from(byLocation.entries()).map(([locId, loc]) => (
                  <div key={locId} style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: ACCENT }}>{loc.name}</div>
                      <div style={{ fontSize: 12, color: "#4A6B82", marginTop: 2 }}>
                        {loc.count} paid ad{loc.count !== 1 ? "s" : ""} · {loc.equipmentProvided ? "50%" : "25%"} revenue share
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "#4A6B82" }}>Ad revenue: <strong style={{ color: ACCENT }}>{formatCents(loc.revenueCents)}</strong></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#166534", marginTop: 2 }}>Your share: {formatCents(loc.earningsCents)}</div>
                    </div>
                    <Link
                      href={`/dashboard/store-owner/locations/${locId}`}
                      style={{ fontSize: 12, color: "#4A90C4", textDecoration: "none", border: "1px solid #4A90C4", padding: "5px 12px", borderRadius: 6, whiteSpace: "nowrap" }}
                    >
                      Manage ↗
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-ad breakdown */}
          <div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>
              All Transactions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.map((row) => {
                const rate = row.equipmentProvided ? 0.5 : 0.25;
                const earningsCents = Math.round(row.amountCents * rate);
                return (
                  <div
                    key={row.paymentId}
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      border: "1px solid #D8E4EE",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left: ad + meta */}
                    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: ACCENT, marginBottom: 2 }}>
                        {row.adTitle}
                      </div>
                      <div style={{ fontSize: 12, color: "#4A6B82" }}>
                        by {row.advertiserName}
                      </div>
                      <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 4 }}>
                        {row.locationName} · {new Date(row.paymentCreatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {/* Right: amounts */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "#4A6B82", marginBottom: 2 }}>
                        Ad revenue: <span style={{ fontWeight: 600, color: ACCENT }}>{formatCents(row.amountCents, row.currency)}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#166534" }}>
                        {formatCents(earningsCents, row.currency)}
                      </div>
                      <div style={{ fontSize: 10, color: "#5B7D96" }}>
                        your {(rate * 100).toFixed(0)}% share
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payout notice */}
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "16px 20px", fontSize: 13, color: "#92400E" }}>
            <strong>Payout notice:</strong> Earnings are accumulated and paid out manually on a monthly basis. Contact us if you have questions about your balance.
          </div>
        </div>
      )}
    </div>
  );
}
