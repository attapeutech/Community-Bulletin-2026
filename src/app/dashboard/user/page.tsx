import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { ads, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { className: string; label: string }> = {
  pending:   { className: "bg-yellow-50 text-yellow-800 border-yellow-200", label: "Pending Review" },
  approved:  { className: "bg-green-50 text-green-800 border-green-200",   label: "Approved" },
  denied:    { className: "bg-red-50 text-red-800 border-red-200",         label: "Denied" },
  expired:   { className: "bg-slate-100 text-slate-600 border-slate-200",  label: "Expired" },
  cancelled: { className: "bg-slate-100 text-slate-600 border-slate-200",  label: "Cancelled" },
};

const PAY: Record<string, { className: string; label: string }> = {
  unpaid:         { className: "bg-orange-50 text-orange-800 border-orange-200",  label: "Unpaid" },
  paid:           { className: "bg-green-50 text-green-800 border-green-200",    label: "Paid" },
  refunded:       { className: "bg-indigo-50 text-indigo-800 border-indigo-200", label: "Refunded" },
  refund_pending: { className: "bg-yellow-50 text-yellow-800 border-yellow-200", label: "Refund Pending" },
  failed:         { className: "bg-red-50 text-red-800 border-red-200",          label: "Failed" },
};

export default async function UserDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = session.user as any;
  const userId = user.id as string;

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
  const totalAds   = userAds.length;
  const activeAds  = userAds.filter((a) => a.status === "approved" && a.endedAt >= now).length;
  const pendingAds = userAds.filter((a) => a.status === "pending").length;
  const paidAds    = userAds.filter((a) => a.paymentStatus === "paid").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
        <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C]">
          Welcome back, {user.name.split(" ")[0]}!
        </h1>
        <Link
          href="/ads/new"
          className="no-underline shrink-0 bg-[#E8563A] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d44e34] transition-colors"
        >
          + Post New Ad
        </Link>
      </div>
      <p className="text-[#6B8FA8] text-sm mb-8">Manage your ads and track their status.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Ads",      value: totalAds },
          { label: "Active",         value: activeAds },
          { label: "Pending Review", value: pendingAds },
          { label: "Paid",           value: paidAds },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[#D8E4EE] px-5 py-4">
            <div className="text-[11px] font-semibold text-[#6B8FA8] uppercase tracking-[0.05em] mb-1">{label}</div>
            <div className="font-serif text-[28px] font-bold text-[#1A3A5C]">{value}</div>
          </div>
        ))}
      </div>

      {/* Ads list */}
      {userAds.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D8E4EE] p-12 text-center">
          <div className="text-[40px] mb-4">📋</div>
          <h2 className="font-serif text-lg text-[#1A3A5C] mb-2">No ads yet</h2>
          <p className="text-[#6B8FA8] text-sm mb-6">
            Post your first ad and reach customers at local store locations.
          </p>
          <Link
            href="/ads/new"
            className="no-underline inline-block bg-[#1A3A5C] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
          >
            Post your first ad
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D8E4EE] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#D8E4EE] flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#1A3A5C]">Your Ads</h2>
            <span className="text-xs text-[#9DC4E0]">{totalAds} total</span>
          </div>

          <div className="divide-y divide-[#D8E4EE]">
            {userAds.map((ad) => {
              const adStatus  = STATUS[ad.status]      ?? STATUS.pending;
              const payStatus = PAY[ad.paymentStatus]  ?? PAY.unpaid;
              const needsPayment = ad.paymentStatus === "unpaid";

              return (
                <div key={ad.id} className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                  {/* Thumbnail */}
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full sm:w-[88px] h-[160px] sm:h-[62px] object-cover rounded-lg shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/dashboard/user/ads/${ad.id}`}
                        className="font-semibold text-[15px] text-[#1A3A5C] no-underline hover:underline"
                      >
                        {ad.title}
                      </Link>
                      <Badge variant="outline" className={cn("text-[11px] font-semibold", adStatus.className)}>
                        {adStatus.label}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[11px] font-semibold", payStatus.className)}>
                        {payStatus.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#6B8FA8]">
                      {ad.location.storeName} · {ad.location.addressLine1}, {ad.location.cityName}, {ad.location.stateCode} {ad.location.postalCode}
                      {ad.status === "approved" && (
                        <span> · {new Date(ad.startedAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })} – {new Date(ad.endedAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9DC4E0] mt-1">
                      Submitted {new Date(ad.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap items-start shrink-0">
                    {needsPayment && (
                      <Link
                        href={`/ads/${ad.id}/payment`}
                        className="no-underline text-xs font-semibold bg-[#E8563A] text-white px-3.5 py-1.5 rounded-lg hover:bg-[#d44e34] transition-colors"
                      >
                        Pay Now
                      </Link>
                    )}
                    {ad.status === "approved" && (
                      <Link
                        href={`/display/${ad.location.slug}`}
                        target="_blank"
                        className="no-underline text-xs font-semibold text-[#4A90C4] border border-[#4A90C4] px-3 py-1.5 rounded-lg hover:bg-[#4A90C4]/10 transition-colors"
                      >
                        View Live ↗
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/user/ads/${ad.id}`}
                      className="no-underline text-xs text-[#6B8FA8] border border-[#D8E4EE] px-3 py-1.5 rounded-lg hover:bg-[#F4F7FB] transition-colors"
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
