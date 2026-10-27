import { requireStoreOwner, getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations, ads, users, countries, states, cities, postalCodes, ownerEarnings } from "@/lib/db/schema";
import { eq, and, count, sum, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { AD_PRICE_CENTS, DEFAULT_SHARE_RATE_BPS, MIN_PRICE_PER_WEEK_CENTS, MAX_PRICE_PER_WEEK_CENTS, MAX_SHARE_RATE_BPS } from "@/types";

const ACCENT = "#1A3A5C";

function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {children}
    </span>
  );
}

// Admin quick reference — keep in sync with the limits in src/types and the locations API
function AdminPricingNotes() {
  const h: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--cb-ink)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "14px 0 6px" };
  const ul: React.CSSProperties = { margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 };
  return (
    <details style={{ background: "var(--cb-surface-2)", border: "1px solid var(--cb-line)", borderRadius: 12, padding: "12px 18px", marginTop: -16, marginBottom: 28, fontSize: 13, color: "var(--cb-ink-2)", lineHeight: 1.55 }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--cb-ink)", fontSize: 14 }}>
        📝 Admin notes: how pricing &amp; revenue share work
      </summary>

      <div style={h}>Admins</div>
      <p style={{ margin: "0 0 6px" }}>
        Go to <strong>Manage → Edit</strong> on any location. The <strong>Pricing &amp; Revenue Share · admin only</strong> section has:
      </p>
      <ul style={ul}>
        <li><strong>Price per week:</strong> {formatCents(MIN_PRICE_PER_WEEK_CENTS)}–{formatCents(MAX_PRICE_PER_WEEK_CENTS)}</li>
        <li><strong>Store owner share (%):</strong> 25% and 50% quick buttons, or any value from 0 to {MAX_SHARE_RATE_BPS / 100}%</li>
        <li><strong>&ldquo;Store owner provides the TV, Wi-Fi &amp; hardware&rdquo;:</strong> for information only; it does not set the share</li>
        <li>Changing a share affects <strong>new payments only</strong>; earnings already recorded keep their original rate</li>
      </ul>

      <div style={h}>Store owners</div>
      <ul style={ul}>
        <li>See price and share as read-only, with &ldquo;Set by CommunityBulletin. Contact us to discuss changes.&rdquo;</li>
        <li>The server ignores any attempt to change them, even outside the form</li>
        <li>New locations they create start at {formatCents(AD_PRICE_CENTS)}/week and {DEFAULT_SHARE_RATE_BPS / 100}%</li>
      </ul>

      <div style={h}>Advertisers</div>
      <ul style={ul}>
        <li>Post a New Ad shows each store&apos;s price in the search results, and &ldquo;Priced per store&rdquo; until one is picked</li>
        <li>The heading, the Review step and the payment page show the chosen store&apos;s price, and Stripe and PayPal charge it</li>
        <li>Renewals use the store&apos;s current price</li>
      </ul>
    </details>
  );
}

function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function StoreOwnerPage() {
  const session = await requireStoreOwner();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isAdmin = role === "admin";

  // Admins also see deactivated locations (so they can reactivate or delete them)
  const conditions = isAdmin
    ? []
    : [eq(locations.storeOwnerId, userId), eq(locations.isActive, true)];

  const locs = await db
    .select({
      id: locations.id,
      storeName: locations.storeName,
      storeNumber: locations.storeNumber,
      addressLine1: locations.addressLine1,
      slug: locations.slug,
      displayName: locations.displayName,
      isActive: locations.isActive,
      createdAt: locations.createdAt,
      currency: locations.currency,
      pricePerWeekCents: locations.pricePerWeekCents,
      equipmentProvided: locations.equipmentProvided,
      shareRateBps: locations.shareRateBps,
      category: locations.category,
      logoUrl: locations.logoUrl,
      storeOwner: { id: users.id, name: users.name },
      city: { name: cities.name },
      state: { code: states.code },
      postalCode: { code: postalCodes.code },
    })
    .from(locations)
    .innerJoin(users, eq(locations.storeOwnerId, users.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(and(...conditions))
    .orderBy(desc(locations.createdAt));

  // Active ad counts per location
  const adCounts = await db
    .select({ locationId: ads.locationId, total: count() })
    .from(ads)
    .where(eq(ads.status, "approved"))
    .groupBy(ads.locationId);
  const adCountMap = Object.fromEntries(adCounts.map((r) => [r.locationId, r.total]));

  // Owner earnings per location (from the earnings ledger: released or paid out)
  const earningsRows = await db
    .select({ locationId: ownerEarnings.locationId, totalCents: sum(ownerEarnings.amountCents) })
    .from(ownerEarnings)
    .where(inArray(ownerEarnings.status, ["available", "paid"]))
    .groupBy(ownerEarnings.locationId);
  const earningsMap = Object.fromEntries(
    earningsRows.map((r) => [r.locationId, Number(r.totalCents ?? 0)])
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "var(--cb-ink)" }}>
          {isAdmin ? "All Locations" : "My Locations"}
        </h1>
        <Link
          href="/dashboard/store-owner/locations/new"
          style={{ background: "#E8563A", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}
        >
          + Add Location
        </Link>
      </div>
      <p style={{ color: "var(--cb-ink-2)", fontSize: 14, marginBottom: 32 }}>
        {isAdmin ? "Manage all store locations across the platform." : "Manage your store locations and their active ad displays."}
      </p>

      {isAdmin && <AdminPricingNotes />}

      {locs.length === 0 ? (
        <div style={{ background: "var(--cb-surface)", borderRadius: 12, border: "1px solid var(--cb-line)", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "var(--cb-ink)", marginBottom: 8 }}>No locations yet</h2>
          <p style={{ color: "var(--cb-ink-2)", fontSize: 14, marginBottom: 24 }}>Add your first store location to start accepting ads.</p>
          <Link href="/dashboard/store-owner/locations/new" style={{ background: ACCENT, color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            Add first location
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {locs.map((loc) => {
            const earningsCents = earningsMap[loc.id] ?? 0;
            const activeAds = adCountMap[loc.id] ?? 0;

            return (
              <div key={loc.id} className="p-4 sm:px-6 sm:py-5" style={{ background: "var(--cb-surface)", borderRadius: 12, border: "1px solid var(--cb-line)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  {/* Logo or icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "#F0F7FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {loc.logoUrl
                      ? <img src={loc.logoUrl} alt={loc.storeName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 24 }}>🏪</span>
                    }
                  </div>

                  {/* Info: on phones the actions wrap below it instead of squeezing it */}
                  <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--cb-ink)" }}>
                        {loc.storeName}
                        {loc.storeNumber && <span style={{ color: "#E8563A", marginLeft: 6 }}>#{loc.storeNumber.replace(/^#/, "")}</span>}
                        {!loc.isActive && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, fontFamily: "system-ui, sans-serif", color: "#64748B", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 999, padding: "2px 8px", verticalAlign: "middle" }}>Inactive</span>}
                      </span>
                      <Badge bg="#dcfce7" color="#166534">{activeAds} active ad{activeAds !== 1 ? "s" : ""}</Badge>
                      {loc.category && <Badge bg="#EEF2FF" color="#3730A3">{loc.category}</Badge>}
                      {isAdmin && <Badge bg="#E8EFF6" color="#1A3A5C">{loc.storeOwner.name}</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--cb-ink-2)" }}>
                      {loc.addressLine1} · {loc.city.name}, {loc.state.code} {loc.postalCode.code}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--cb-ink-3)", marginTop: 4, fontFamily: "monospace", overflowWrap: "anywhere" }}>
                      /display/{loc.slug}
                    </div>

                    {/* Pricing + earnings row */}
                    <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "var(--cb-ink-2)" }}>Price / week: </span>
                        <span style={{ fontWeight: 600, color: "var(--cb-ink)" }}>{formatCents(loc.pricePerWeekCents, loc.currency)}</span>
                      </div>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "var(--cb-ink-2)" }}>Revenue share: </span>
                        <span style={{ fontWeight: 600, color: "var(--cb-green)" }}>
                          {loc.shareRateBps / 100}%
                        </span>
                        <span style={{ fontSize: 11, color: "var(--cb-ink-3)", marginLeft: 4 }}>
                          ({loc.equipmentProvided ? "owner provides equipment" : "platform equipment"})
                        </span>
                      </div>
                      {earningsCents > 0 && (
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: "var(--cb-ink-2)" }}>Your earnings: </span>
                          <span style={{ fontWeight: 600, color: "var(--cb-green)" }}>{formatCents(earningsCents, loc.currency)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignSelf: "flex-start" }}>
                    <Link
                      href={`/display/${loc.slug}`}
                      target="_blank"
                      style={{ fontSize: 12, color: "#4A90C4", border: "1px solid #4A90C4", padding: "6px 12px", borderRadius: 6, textDecoration: "none" }}
                    >
                      View Display ↗
                    </Link>
                    <Link
                      href={`/dashboard/store-owner/locations/${loc.id}`}
                      style={{ fontSize: 12, color: "#fff", background: ACCENT, padding: "6px 14px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
