import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { ads, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import Link from "next/link";
import { RenewAdButton } from "./RenewAdButton";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#fef9c3", color: "#854d0e", label: "Pending Review" },
  approved:  { bg: "#dcfce7", color: "#166534", label: "Approved" },
  denied:    { bg: "#fee2e2", color: "#991b1b", label: "Denied" },
  expired:   { bg: "#f1f5f9", color: "#475569", label: "Expired" },
  cancelled: { bg: "#f1f5f9", color: "#475569", label: "Cancelled" },
};

const PAY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  unpaid:        { bg: "#fff7ed", color: "#c2410c", label: "Unpaid" },
  paid:          { bg: "#dcfce7", color: "#166534", label: "Paid" },
  refunded:      { bg: "#e0e7ff", color: "#3730a3", label: "Refunded" },
  refund_pending:{ bg: "#fef9c3", color: "#854d0e", label: "Refund Pending" },
  failed:        { bg: "#fee2e2", color: "#991b1b", label: "Failed" },
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: bg,
      color,
    }}>
      {label}
    </span>
  );
}

export default async function UserDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = session.user as any;
  const userId = user.id as string;

  // Fetch user's ads with location
  const userAds = await db
    .select({
      id: ads.id,
      title: ads.title,
      imageUrl: ads.imageUrl,
      status: ads.status,
      paymentStatus: ads.paymentStatus,
      startedAt: ads.startedAt,
      endedAt: ads.endedAt,
      createdAt: ads.createdAt,
      location: {
        storeName: locations.storeName,
        slug: locations.slug,
        addressLine1: locations.addressLine1,
        cityName: cities.name,
        stateCode: states.code,
        postalCode: postalCodes.code,
      },
    })
    .from(ads)
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(eq(ads.userId, userId))
    .orderBy(desc(ads.createdAt))
    .limit(50);

  const now = new Date();
  const totalAds = userAds.length;
  const activeAds = userAds.filter(
    (a) => a.status === "approved" && a.endedAt >= now
  ).length;
  const pendingAds = userAds.filter((a) => a.status === "pending").length;
  const paidAds = userAds.filter((a) => a.paymentStatus === "paid").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#1A3A5C" }}>
          Welcome back, {user.name.split(" ")[0]}!
        </h1>
        <Link
          href="/ads/new"
          style={{
            display: "inline-block",
            background: "#E8563A",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          + Post New Ad
        </Link>
      </div>
      <p style={{ color: "#4A6B82", fontSize: 14, marginBottom: 32 }}>
        Manage your ads and track their status.
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Ads", value: totalAds },
          { label: "Active", value: activeAds },
          { label: "Pending Review", value: pendingAds },
          { label: "Paid", value: paidAds },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "0.5px solid #D8E4EE" }}>
            <div style={{ fontSize: 12, color: "#4A6B82", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1A3A5C", fontFamily: "Georgia,serif" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Ads list */}
      {userAds.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D8E4EE", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "#1A3A5C", marginBottom: 8 }}>No ads yet</h2>
          <p style={{ color: "#4A6B82", fontSize: 14, marginBottom: 24 }}>
            Post your first ad and reach customers at local store locations.
          </p>
          <Link
            href="/ads/new"
            style={{
              display: "inline-block",
              background: "#1A3A5C",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Post your first ad
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D8E4EE", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #D8E4EE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "#1A3A5C" }}>Your Ads</h2>
          </div>

          <div>
            {userAds.map((ad, idx) => {
              const adStatus = STATUS_STYLES[ad.status] ?? STATUS_STYLES.pending;
              const payStatus = PAY_STYLES[ad.paymentStatus] ?? PAY_STYLES.unpaid;
              const needsPayment = ad.paymentStatus === "unpaid";

              return (
                <div
                  key={ad.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    padding: "16px 24px",
                    borderBottom: idx < userAds.length - 1 ? "1px solid #D8E4EE" : "none",
                  }}
                >
                  {/* Thumbnail */}
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <Link
                        href={`/dashboard/user/ads/${ad.id}`}
                        style={{ fontWeight: 600, fontSize: 15, color: "#1A3A5C", textDecoration: "none" }}
                      >
                        {ad.title}
                      </Link>
                      <Badge {...adStatus} />
                      <Badge {...payStatus} />
                    </div>
                    <div style={{ fontSize: 12, color: "#4A6B82" }}>
                      {ad.location.storeName} · {ad.location.addressLine1}, {ad.location.cityName}, {ad.location.stateCode} {ad.location.postalCode}
                    </div>
                    {(ad.status === "approved" || ad.status === "expired" || ad.status === "cancelled") && (
                      <div style={{ fontSize: 11, color: "#4A6B82", marginTop: 1 }}>
                        {ad.status === "approved" ? "Runs" : "Ran"}{" "}
                        {new Date(ad.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" – "}
                        {new Date(ad.endedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#5B7D96", marginTop: 2 }}>
                      Submitted {new Date(ad.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
                    {needsPayment && (
                      <Link
                        href={`/ads/${ad.id}/payment`}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          background: "#E8563A",
                          color: "#fff",
                          padding: "6px 14px",
                          borderRadius: 6,
                          textDecoration: "none",
                        }}
                      >
                        Pay Now
                      </Link>
                    )}
                    {ad.status === "approved" && (
                      <Link
                        href={`/display/${ad.location.slug}`}
                        target="_blank"
                        style={{
                          fontSize: 12,
                          color: "#4A90C4",
                          textDecoration: "none",
                          border: "1px solid #4A90C4",
                          padding: "5px 12px",
                          borderRadius: 6,
                        }}
                      >
                        View Live ↗
                      </Link>
                    )}
                    {(ad.status === "expired" || ad.status === "cancelled") && (
                      <RenewAdButton adId={ad.id} />
                    )}
                    <Link
                      href={`/dashboard/user/ads/${ad.id}`}
                      style={{ fontSize: 12, color: "#4A6B82", textDecoration: "none" }}
                    >
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
