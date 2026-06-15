import { requireStoreOwner, getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations, ads, users, countries, states, cities, postalCodes, payments } from "@/lib/db/schema";
import { eq, and, count, sum, desc } from "drizzle-orm";
import Link from "next/link";

const ACCENT = "#1A3A5C";

function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {children}
    </span>
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

  const conditions = isAdmin
    ? [eq(locations.isActive, true)]
    : [eq(locations.storeOwnerId, userId), eq(locations.isActive, true)];

  const locs = await db
    .select({
      id: locations.id,
      storeName: locations.storeName,
      addressLine1: locations.addressLine1,
      slug: locations.slug,
      displayName: locations.displayName,
      isActive: locations.isActive,
      createdAt: locations.createdAt,
      currency: locations.currency,
      pricePerWeekCents: locations.pricePerWeekCents,
      equipmentProvided: locations.equipmentProvided,
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

  // Total paid revenue per location (from payments)
  const earningsRows = await db
    .select({ locationId: ads.locationId, totalCents: sum(payments.amountCents) })
    .from(payments)
    .innerJoin(ads, eq(payments.adId, ads.id))
    .where(eq(payments.status, "paid"))
    .groupBy(ads.locationId);
  const earningsMap = Object.fromEntries(
    earningsRows.map((r) => [r.locationId, Number(r.totalCents ?? 0)])
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT }}>
          {isAdmin ? "All Locations" : "My Locations"}
        </h1>
        <Link
          href="/dashboard/store-owner/locations/new"
          style={{ background: "#E8563A", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}
        >
          + Add Location
        </Link>
      </div>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
        {isAdmin ? "Manage all store locations across the platform." : "Manage your store locations and their active ad displays."}
      </p>

      {locs.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, marginBottom: 8 }}>No locations yet</h2>
          <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 24 }}>Add your first store location to start accepting ads.</p>
          <Link href="/dashboard/store-owner/locations/new" style={{ background: ACCENT, color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            Add first location
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {locs.map((loc) => {
            const totalRevCents = earningsMap[loc.id] ?? 0;
            const shareRate = loc.equipmentProvided ? 0.5 : 0.25;
            const earningsCents = Math.round(totalRevCents * shareRate);
            const activeAds = adCountMap[loc.id] ?? 0;

            return (
              <div key={loc.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  {/* Logo or icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "#F0F7FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {loc.logoUrl
                      ? <img src={loc.logoUrl} alt={loc.storeName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 24 }}>🏪</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: ACCENT }}>{loc.storeName}</span>
                      <Badge bg="#dcfce7" color="#166534">{activeAds} active ad{activeAds !== 1 ? "s" : ""}</Badge>
                      {loc.category && <Badge bg="#EEF2FF" color="#3730A3">{loc.category}</Badge>}
                      {isAdmin && <Badge bg="#E8EFF6" color="#1A3A5C">{loc.storeOwner.name}</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: "#6B8FA8" }}>
                      {loc.addressLine1} · {loc.city.name}, {loc.state.code} {loc.postalCode.code}
                    </div>
                    <div style={{ fontSize: 11, color: "#9DC4E0", marginTop: 4, fontFamily: "monospace" }}>
                      /display/{loc.slug}
                    </div>

                    {/* Pricing + earnings row */}
                    <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "#6B8FA8" }}>Price / week: </span>
                        <span style={{ fontWeight: 600, color: ACCENT }}>{formatCents(loc.pricePerWeekCents, loc.currency)}</span>
                      </div>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "#6B8FA8" }}>Revenue share: </span>
                        <span style={{ fontWeight: 600, color: loc.equipmentProvided ? "#166534" : "#92400E" }}>
                          {loc.equipmentProvided ? "50%" : "25%"}
                        </span>
                        <span style={{ fontSize: 11, color: "#9DC4E0", marginLeft: 4 }}>
                          ({loc.equipmentProvided ? "equipment provided" : "platform equipment"})
                        </span>
                      </div>
                      {totalRevCents > 0 && (
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: "#6B8FA8" }}>Your earnings: </span>
                          <span style={{ fontWeight: 600, color: "#166534" }}>{formatCents(earningsCents, loc.currency)}</span>
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
