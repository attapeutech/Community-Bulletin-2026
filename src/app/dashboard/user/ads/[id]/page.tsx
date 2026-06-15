import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, locations, users, payments, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AdImagePreview from "./AdImagePreview";
import AdActions from "./AdActions";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#fef9c3", color: "#854d0e", label: "Pending Review" },
  approved:  { bg: "#dcfce7", color: "#166534", label: "Approved & Live" },
  denied:    { bg: "#fee2e2", color: "#991b1b", label: "Denied" },
  expired:   { bg: "#f1f5f9", color: "#475569", label: "Expired" },
  cancelled: { bg: "#f1f5f9", color: "#475569", label: "Cancelled" },
};

const PAY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  unpaid:        { bg: "#fff7ed", color: "#c2410c", label: "Unpaid" },
  paid:          { bg: "#dcfce7", color: "#166534", label: "Paid — $100.00" },
  refunded:      { bg: "#e0e7ff", color: "#3730a3", label: "Refunded" },
  refund_pending:{ bg: "#fef9c3", color: "#854d0e", label: "Refund Pending" },
  failed:        { bg: "#fee2e2", color: "#991b1b", label: "Payment Failed" },
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: bg, color }}>
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid #D8E4EE", fontSize: 14 }}>
      <div style={{ width: 160, flexShrink: 0, color: "#6B8FA8", fontSize: 13 }}>{label}</div>
      <div style={{ flex: 1, color: "#1A3A5C" }}>{value}</div>
    </div>
  );
}

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  // Quick auth check before incrementing — just verify ad exists and user has access
  const [quickCheck] = await db
    .select({ userId: ads.userId })
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1);

  if (!quickCheck) notFound();

  if (
    quickCheck.userId !== userId &&
    role !== "approver" &&
    role !== "admin"
  ) {
    redirect("/dashboard");
  }

  // Increment view count now that access is confirmed
  await db.update(ads).set({ viewCount: sql`${ads.viewCount} + 1` }).where(eq(ads.id, id)).catch(() => {});

  // Main query — will reflect the just-incremented viewCount
  const [row] = await db
    .select({
      ad: ads,
      user: { id: users.id, name: users.name, email: users.email },
      location: {
        id: locations.id,
        storeName: locations.storeName,
        slug: locations.slug,
        addressLine1: locations.addressLine1,
        addressLine2: locations.addressLine2,
        cityName: cities.name,
        stateCode: states.code,
        postalCode: postalCodes.code,
      },
    })
    .from(ads)
    .innerJoin(users, eq(ads.userId, users.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(eq(ads.id, id))
    .limit(1);

  if (!row) notFound();

  const adPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.adId, id));

  const { ad, location } = row;
  const adStatus = STATUS_COLORS[ad.status] ?? STATUS_COLORS.pending;
  const payStatus = PAY_COLORS[ad.paymentStatus] ?? PAY_COLORS.unpaid;

  const isOwner = row.user.id === userId;
  const needsPayment = ad.paymentStatus === "unpaid";

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6B8FA8" }}>
        <Link href="/dashboard/user" style={{ color: "#6B8FA8", textDecoration: "none" }}>My Ads</Link>
        <span>›</span>
        <span style={{ color: "#1A3A5C" }}>{ad.title}</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#1A3A5C", marginBottom: 8 }}>
            {ad.title}
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge {...adStatus} />
            <Badge {...payStatus} />
          </div>
        </div>

        {isOwner && needsPayment && (
          <Link
            href={`/ads/${ad.id}/payment`}
            style={{
              display: "inline-block",
              background: "#E8563A",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Complete Payment →
          </Link>
        )}
        {ad.status === "approved" && (
          <Link
            href={`/display/${location.slug}`}
            target="_blank"
            style={{
              display: "inline-block",
              border: "1px solid #4A90C4",
              color: "#4A90C4",
              padding: "9px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            View Live Display ↗
          </Link>
        )}
        <AdActions
          adId={ad.id}
          status={ad.status}
          isOwner={isOwner}
          isAdmin={role === "admin"}
        />
      </div>

      {/* Ad image — display screen style with preview modal */}
      <AdImagePreview
        imageUrl={ad.imageUrl}
        title={ad.title}
        description={ad.description}
        storeName={location.storeName}
        adId={ad.id}
        contactPhone={ad.contactPhone}
        contactAddress={ad.contactAddress}
        contactWebsite={ad.contactWebsite}
        showPhone={ad.showPhone}
        showAddress={ad.showAddress}
        showWebsite={ad.showWebsite}
      />

      {/* Details */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "0 24px", marginBottom: 24 }}>
        <Row label="Location" value={<>{location.storeName}<br /><span style={{ fontSize: 12, color: "#6B8FA8" }}>{location.addressLine1}{location.addressLine2 ? `, ${location.addressLine2}` : ""}, {location.cityName}, {location.stateCode} {location.postalCode}</span></>} />
        <Row label="Title" value={ad.title} />
        {ad.description && <Row label="Description" value={ad.description} />}
        {ad.showWebsite && ad.contactWebsite && (
          <Row label="Website" value={
            <a
              href={`/api/ads/${ad.id}/visit-website`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4A90C4", textDecoration: "underline" }}
            >
              {ad.contactWebsite} ↗
            </a>
          } />
        )}
        <Row label="Status" value={<Badge {...adStatus} />} />
        <Row label="Payment" value={<Badge {...payStatus} />} />
        <Row
          label="Run dates"
          value={
            ad.status === "approved"
              ? `${new Date(ad.startedAt).toLocaleDateString("en-US", { dateStyle: "long" })} – ${new Date(ad.endedAt).toLocaleDateString("en-US", { dateStyle: "long" })}`
              : "Set upon approval"
          }
        />
        <Row
          label="Submitted"
          value={new Date(ad.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
        />
        {ad.reviewNote && (
          <div style={{ padding: "16px 0" }}>
            <div style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 8 }}>Reviewer note</div>
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
              {ad.reviewNote}
            </div>
          </div>
        )}
      </div>

      {/* Analytics */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "16px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6B8FA8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
          Ad Performance
        </div>
        <div style={{ display: "grid", gridTemplateColumns: ad.showWebsite && ad.contactWebsite ? "1fr 1fr" : "1fr", gap: 16 }}>
          <div style={{ background: "#F7F9FC", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1A3A5C" }}>{ad.viewCount.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "#6B8FA8", marginTop: 2 }}>Total views</div>
            <div style={{ fontSize: 11, color: "#9DC4E0", marginTop: 1 }}>detail page opens</div>
          </div>
          {ad.showWebsite && ad.contactWebsite && (
            <div style={{ background: "#F7F9FC", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1A3A5C" }}>{ad.websiteClickCount.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "#6B8FA8", marginTop: 2 }}>Website visits</div>
              <div style={{ fontSize: 11, color: "#9DC4E0", marginTop: 1 }}>clicked through to site</div>
            </div>
          )}
        </div>
      </div>

      {/* Payments */}
      {adPayments.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #D8E4EE" }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 16, color: "#1A3A5C" }}>Payment History</h2>
          </div>
          <div style={{ padding: "0 24px" }}>
            {adPayments.map((pmt) => (
              <div key={pmt.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #D8E4EE", fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1A3A5C", textTransform: "capitalize" }}>{pmt.provider}</div>
                  <div style={{ color: "#6B8FA8", fontSize: 11 }}>{pmt.providerTxId}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600, color: "#1A3A5C" }}>
                    ${(pmt.amountCents / 100).toFixed(2)} {pmt.currency}
                  </div>
                  <div style={{ color: "#6B8FA8", fontSize: 11, textTransform: "capitalize" }}>{pmt.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
