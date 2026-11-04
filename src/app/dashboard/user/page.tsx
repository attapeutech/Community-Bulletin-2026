import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { ads, adSwaps, locations, cities, states, postalCodes, savedAds } from "@/lib/db/schema";
import { eq, and, desc, gte, sql, isNull, inArray } from "drizzle-orm";
import Link from "next/link";
import { RenewAdButton } from "./RenewAdButton";
import { WithdrawSwapButton } from "./WithdrawSwapButton";
import { canSwap } from "@/lib/ad-swaps";
import { UserDashboardRefresher } from "./UserDashboardRefresher";
import { latestApplicationFor } from "@/lib/partner-applications";

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
      viewCount: ads.viewCount,
      websiteClickCount: ads.websiteClickCount,
      saveCount: sql<number>`(select count(*)::int from ${savedAds} where ${savedAds.adId} = ${ads.id})`,
      showWebsite: ads.showWebsite,
      contactWebsite: ads.contactWebsite,
      isTest: ads.isTest,
      demoId: ads.demoId,
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
    // Sales demo ads live on their lead's page in Sales, not in My Ads
    .where(and(eq(ads.userId, userId), isNull(ads.demoId)))
    .orderBy(desc(ads.createdAt))
    .limit(50);

  // Each ad's latest swap (a new version sent while it runs): waiting for review, approved or denied
  const swapRows = userAds.length
    ? await db.select({ adId: adSwaps.adId, status: adSwaps.status, title: adSwaps.title, reviewNote: adSwaps.reviewNote, reviewedAt: adSwaps.reviewedAt })
        .from(adSwaps)
        .where(and(inArray(adSwaps.adId, userAds.map(a => a.id)), sql`${adSwaps.status} <> 'withdrawn'`))
        .orderBy(desc(adSwaps.createdAt))
    : [];
  const latestSwap = new Map<string, (typeof swapRows)[number]>();
  for (const r of swapRows) if (!latestSwap.has(r.adId)) latestSwap.set(r.adId, r);

  const now = new Date();
  const totalAds = userAds.length;
  const activeAds = userAds.filter(
    (a) => a.status === "approved" && a.endedAt >= now
  ).length;
  const pendingAds = userAds.filter((a) => a.status === "pending").length;
  const paidAds = userAds.filter((a) => a.paymentStatus === "paid").length;

  // Store partner application status (shown until approved — then they become a store owner)
  const application = user.role === "user" ? await latestApplicationFor(userId) : null;

  return (
    <div>
      <UserDashboardRefresher adIds={userAds.map(a => a.id)} />
      {application?.status === "pending" && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 18, fontSize: 14, color: "#92400E" }}>
          <strong>Your store partner application for {application.businessName} is under review.</strong>{" "}
          We&apos;ll be in touch soon — you&apos;ll get an email and a notification when it&apos;s reviewed.
        </div>
      )}
      {application?.status === "declined" && (
        <div style={{ background: "var(--cb-surface-2)", border: "1px solid var(--cb-line)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, fontSize: 14, color: "var(--cb-ink)" }}>
          Your store partner application for <strong>{application.businessName}</strong> wasn&apos;t approved
          {application.declineReason ? `: ${application.declineReason}` : "."}{" "}
          <Link href="/partners/apply" style={{ color: "#4A90C4" }}>Apply again</Link>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "var(--cb-ink)" }}>
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
      <p style={{ color: "var(--cb-ink-2)", fontSize: 14, marginBottom: 32 }}>
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
          <div key={label} style={{ background: "var(--cb-surface)", borderRadius: 12, padding: "20px 24px", border: "0.5px solid var(--cb-line)" }}>
            <div style={{ fontSize: 12, color: "var(--cb-ink-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--cb-ink)", fontFamily: "Georgia,serif" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Ads list */}
      {userAds.length === 0 ? (
        <div style={{ background: "var(--cb-surface)", borderRadius: 12, border: "0.5px solid var(--cb-line)", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "var(--cb-ink)", marginBottom: 8 }}>No ads yet</h2>
          <p style={{ color: "var(--cb-ink-2)", fontSize: 14, marginBottom: 24 }}>
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
        <div style={{ background: "var(--cb-surface)", borderRadius: 12, border: "0.5px solid var(--cb-line)", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--cb-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "var(--cb-ink)" }}>Your Ads</h2>
          </div>

          {/* How swapping works: shown once there's a running paid ad to swap (or a swap) */}
          {userAds.some(a => canSwap(a, now) || latestSwap.has(a.id)) && (
            <details style={{ margin: "12px 24px 0", background: "var(--cb-surface-2)", border: "1px solid var(--cb-line)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--cb-ink-2)", lineHeight: 1.6 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--cb-ink)" }}>🔄 How Swap ad works</summary>
              <ul style={{ margin: "8px 0 2px", paddingLeft: 20 }}>
                <li>Sold the item, or have a new offer? Click <strong>Swap ad</strong> on a paid ad that&apos;s running. No extra payment.</li>
                <li>The form starts from your current ad. Change the photo, offer or text, then send it for review.</li>
                <li>Your current ad keeps showing until the new one is approved, then the new one takes its place. The end date stays the same.</li>
                <li>It must be for the <strong>same business</strong> at the same store. For a different business, post a new ad.</li>
                <li>Swap as often as you like, one at a time. <strong>Withdraw</strong> cancels a swap that&apos;s still waiting.</li>
                <li>Not approved? Your current ad keeps running, and you&apos;ll see the reviewer&apos;s note here.</li>
                <li>Screen views and website visits keep adding up across versions.</li>
              </ul>
            </details>
          )}

          <div>
            {userAds.map((ad, idx) => {
              const adStatus = STATUS_STYLES[ad.status] ?? STATUS_STYLES.pending;
              const payStatus = PAY_STYLES[ad.paymentStatus] ?? PAY_STYLES.unpaid;
              const needsPayment = ad.paymentStatus === "unpaid";
              const swap = latestSwap.get(ad.id);
              const swappable = canSwap(ad, now);

              return (
                <div
                  key={ad.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    padding: "16px 24px",
                    borderBottom: idx < userAds.length - 1 ? "1px solid var(--cb-line)" : "none",
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
                        style={{ fontWeight: 600, fontSize: 15, color: "var(--cb-ink)", textDecoration: "none" }}
                      >
                        {ad.title}
                      </Link>
                      {ad.isTest ? <Badge bg="#FEF3C7" color="#92400E" label="Test ad" /> : (<><Badge {...adStatus} /><Badge {...payStatus} /></>)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cb-ink-2)" }}>
                      {ad.location.storeName} · {ad.location.addressLine1}, {ad.location.cityName}, {ad.location.stateCode} {ad.location.postalCode}
                    </div>
                    {(ad.status === "approved" || ad.status === "expired" || ad.status === "cancelled") && (
                      <div style={{ fontSize: 11, color: "var(--cb-ink-2)", marginTop: 1 }}>
                        {ad.status === "approved" ? "Runs" : "Ran"}{" "}
                        {new Date(ad.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" – "}
                        {new Date(ad.endedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--cb-ink-3)", marginTop: 2 }}>
                      Submitted {new Date(ad.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {swap?.status === "approved" && swap.reviewedAt && <> · swapped {new Date(swap.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} (counts include the earlier version)</>}
                    </div>
                    {swap?.status === "pending" && (
                      <div style={{ fontSize: 12, color: "#5B21B6", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 6, padding: "5px 10px", marginTop: 6, display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span>🔄 New version &ldquo;{swap.title}&rdquo; is waiting for review. This ad keeps running until then.</span>
                        <WithdrawSwapButton adId={ad.id} />
                      </div>
                    )}
                    {swap?.status === "denied" && swappable && (
                      <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 10px", marginTop: 6 }}>
                        Your swap &ldquo;{swap.title}&rdquo; wasn&apos;t approved{swap.reviewNote ? `: ${swap.reviewNote}` : "."} This ad keeps running; you can send another version.
                      </div>
                    )}
                    {(ad.status === "approved" || ad.status === "expired" || ad.status === "cancelled") && (
                      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--cb-ink-2)" }}>
                          👁 <strong style={{ color: "var(--cb-ink)" }}>{ad.viewCount.toLocaleString()}</strong> screen views
                        </span>
                        {ad.showWebsite && ad.contactWebsite && (
                          <span style={{ fontSize: 11, color: "var(--cb-ink-2)" }}>
                            🌐 <strong style={{ color: "var(--cb-ink)" }}>{ad.websiteClickCount.toLocaleString()}</strong> website visits
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "var(--cb-ink-2)" }}>
                          ♥ <strong style={{ color: "var(--cb-ink)" }}>{ad.saveCount.toLocaleString()}</strong> saves
                        </span>
                      </div>
                    )}
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
                        href={`/display/${ad.location.slug}?ad=${ad.id}`}
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
                    {swappable && swap?.status !== "pending" && (
                      <Link
                        href={`/ads/new?swap=${ad.id}`}
                        title="Replace this ad with a new one for the same business. Reviewed, no extra payment."
                        style={{ fontSize: 12, fontWeight: 600, background: "#1A3A5C", color: "#fff", padding: "6px 14px", borderRadius: 6, textDecoration: "none" }}
                      >
                        Swap ad
                      </Link>
                    )}
                    {(ad.status === "expired" || ad.status === "cancelled") && (
                      <RenewAdButton adId={ad.id} />
                    )}
                    <Link
                      href={`/dashboard/user/ads/${ad.id}`}
                      style={{ fontSize: 12, color: "var(--cb-ink-2)", textDecoration: "none" }}
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
