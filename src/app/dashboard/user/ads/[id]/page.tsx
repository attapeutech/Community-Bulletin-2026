import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, locations, users, payments, cities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

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

  const [row] = await db
    .select({
      ad: ads,
      user: { id: users.id, name: users.name, email: users.email },
      location: {
        id: locations.id,
        storeName: locations.storeName,
        slug: locations.slug,
        addressLine1: locations.addressLine1,
        cityName: cities.name,
      },
    })
    .from(ads)
    .innerJoin(users, eq(ads.userId, users.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .where(eq(ads.id, id))
    .limit(1);

  if (!row) notFound();

  // Only owner, approver, or admin can view
  if (
    row.user.id !== userId &&
    role !== "approver" &&
    role !== "admin"
  ) {
    redirect("/dashboard");
  }

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
      </div>

      {/* Ad image — display screen style */}
      <div style={{ background: "#0A1A2E", borderRadius: 12, overflow: "hidden", marginBottom: 24, position: "relative" }}>
        <img
          src={ad.imageUrl}
          alt={ad.title}
          style={{ width: "100%", maxHeight: 380, objectFit: "contain", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 25%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
            Store Location: {location.storeName} — {location.cityName} ({location.addressLine1})
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", marginLeft: 12 }}>
            Ad #{ad.id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Details */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "0 24px", marginBottom: 24 }}>
        <Row label="Location" value={<>{location.storeName}<br /><span style={{ fontSize: 12, color: "#6B8FA8" }}>{location.addressLine1}</span></>} />
        <Row label="Title" value={ad.title} />
        {ad.description && <Row label="Description" value={ad.description} />}
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
