import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, locations, users, payments, cities, states, postalCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AdImagePreview from "./AdImagePreview";

const STATUS: Record<string, { className: string; label: string }> = {
  pending:   { className: "bg-yellow-50 text-yellow-800 border-yellow-200", label: "Pending Review" },
  approved:  { className: "bg-green-50 text-green-800 border-green-200",   label: "Approved & Live" },
  denied:    { className: "bg-red-50 text-red-800 border-red-200",         label: "Denied" },
  expired:   { className: "bg-slate-100 text-slate-600 border-slate-200",  label: "Expired" },
  cancelled: { className: "bg-slate-100 text-slate-600 border-slate-200",  label: "Cancelled" },
};

const PAY: Record<string, { className: string; label: string }> = {
  unpaid:         { className: "bg-orange-50 text-orange-800 border-orange-200",  label: "Unpaid" },
  paid:           { className: "bg-green-50 text-green-800 border-green-200",    label: "Paid — $100.00" },
  refunded:       { className: "bg-indigo-50 text-indigo-800 border-indigo-200", label: "Refunded" },
  refund_pending: { className: "bg-yellow-50 text-yellow-800 border-yellow-200", label: "Refund Pending" },
  failed:         { className: "bg-red-50 text-red-800 border-red-200",          label: "Payment Failed" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 border-b border-[#D8E4EE] last:border-0 text-sm">
      <div className="w-full sm:w-40 shrink-0 text-[#6B8FA8] text-[13px]">{label}</div>
      <div className="flex-1 text-[#1A3A5C]">{children}</div>
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
  const role   = (session.user as any).role as string;

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
  if (row.user.id !== userId && role !== "approver" && role !== "admin") redirect("/dashboard");

  const adPayments = await db.select().from(payments).where(eq(payments.adId, id));

  const { ad, location } = row;
  const adStatus  = STATUS[ad.status]         ?? STATUS.pending;
  const payStatus = PAY[ad.paymentStatus]     ?? PAY.unpaid;
  const isOwner      = row.user.id === userId;
  const needsPayment = ad.paymentStatus === "unpaid";

  return (
    <div className="max-w-[720px]">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-[13px] text-[#6B8FA8]">
        <Link href="/dashboard/user" className="text-[#6B8FA8] no-underline hover:underline">My Ads</Link>
        <span>›</span>
        <span className="text-[#1A3A5C]">{ad.title}</span>
      </div>

      {/* Title + actions */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[24px] font-bold text-[#1A3A5C] mb-2">{ad.title}</h1>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[13px] font-semibold px-3.5 py-1", adStatus.className)}>
              {adStatus.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[13px] font-semibold px-3.5 py-1", payStatus.className)}>
              {payStatus.label}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isOwner && needsPayment && (
            <Link
              href={`/ads/${ad.id}/payment`}
              className="no-underline text-sm font-semibold bg-[#E8563A] text-white px-5 py-2.5 rounded-lg hover:bg-[#d44e34] transition-colors"
            >
              Complete Payment →
            </Link>
          )}
          {ad.status === "approved" && (
            <Link
              href={`/display/${location.slug}`}
              target="_blank"
              className="no-underline text-sm font-semibold text-[#4A90C4] border border-[#4A90C4] px-4 py-2.5 rounded-lg hover:bg-[#4A90C4]/10 transition-colors"
            >
              View Live Display ↗
            </Link>
          )}
        </div>
      </div>

      {/* Ad image preview */}
      <AdImagePreview
        imageUrl={ad.imageUrl}
        title={ad.title}
        storeName={location.storeName}
        addressLine1={location.addressLine1}
        addressLine2={location.addressLine2}
        cityName={location.cityName}
        stateCode={location.stateCode}
        postalCode={location.postalCode}
        adId={ad.id}
      />

      {/* Details card */}
      <div className="bg-white rounded-xl border border-[#D8E4EE] px-5 sm:px-6 mb-6">
        <Row label="Location">
          <span className="font-medium">{location.storeName}</span>
          <br />
          <span className="text-[12px] text-[#6B8FA8]">
            {location.addressLine1}{location.addressLine2 ? `, ${location.addressLine2}` : ""}, {location.cityName}, {location.stateCode} {location.postalCode}
          </span>
        </Row>
        <Row label="Title">{ad.title}</Row>
        {ad.description && <Row label="Description">{ad.description}</Row>}
        <Row label="Status">
          <Badge variant="outline" className={cn("text-[12px] font-semibold", adStatus.className)}>
            {adStatus.label}
          </Badge>
        </Row>
        <Row label="Payment">
          <Badge variant="outline" className={cn("text-[12px] font-semibold", payStatus.className)}>
            {payStatus.label}
          </Badge>
        </Row>
        <Row label="Run dates">
          {ad.status === "approved"
            ? `${new Date(ad.startedAt).toLocaleDateString("en-US", { dateStyle: "long" })} – ${new Date(ad.endedAt).toLocaleDateString("en-US", { dateStyle: "long" })}`
            : <span className="text-[#9DC4E0]">Set upon approval</span>}
        </Row>
        <Row label="Submitted">
          {new Date(ad.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
        </Row>
        {ad.reviewNote && (
          <Row label="Reviewer note">
            <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-[13px] text-red-800">
              {ad.reviewNote}
            </div>
          </Row>
        )}
      </div>

      {/* Payment history */}
      {adPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EE] overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#D8E4EE]">
            <h2 className="font-serif text-base text-[#1A3A5C]">Payment History</h2>
          </div>
          <div className="divide-y divide-[#D8E4EE]">
            {adPayments.map((pmt) => (
              <div key={pmt.id} className="flex justify-between items-start px-5 sm:px-6 py-3 text-[13px]">
                <div>
                  <div className="font-semibold text-[#1A3A5C] capitalize">{pmt.provider}</div>
                  <div className="text-[11px] text-[#9DC4E0] font-mono mt-0.5 break-all">{pmt.providerTxId}</div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="font-semibold text-[#1A3A5C]">${(pmt.amountCents / 100).toFixed(2)} {pmt.currency}</div>
                  <div className="text-[11px] text-[#6B8FA8] capitalize mt-0.5">{pmt.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
