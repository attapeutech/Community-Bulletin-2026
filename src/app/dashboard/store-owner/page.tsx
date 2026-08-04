import { requireStoreOwner, getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations, ads, users, countries, states, cities, postalCodes } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

  const adCounts = await db
    .select({ locationId: ads.locationId, total: count() })
    .from(ads)
    .where(eq(ads.status, "approved"))
    .groupBy(ads.locationId);
  const adCountMap = Object.fromEntries(adCounts.map((r) => [r.locationId, r.total]));

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
        <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C]">
          {isAdmin ? "All Locations" : "My Locations"}
        </h1>
        <Link
          href="/dashboard/store-owner/locations/new"
          className="no-underline shrink-0 bg-[#E8563A] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#d44e34] transition-colors"
        >
          + Add Location
        </Link>
      </div>
      <p className="text-[#6B8FA8] text-sm mb-8">
        {isAdmin
          ? "Manage all store locations across the platform."
          : "Manage your store locations and their active ad displays."}
      </p>

      {locs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D8E4EE] p-12 text-center">
          <div className="text-[40px] mb-3">🏪</div>
          <h2 className="font-serif text-lg text-[#1A3A5C] mb-2">No locations yet</h2>
          <p className="text-[#6B8FA8] text-sm mb-6">
            Add your first store location to start accepting ads.
          </p>
          <Link
            href="/dashboard/store-owner/locations/new"
            className="no-underline inline-block bg-[#1A3A5C] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
          >
            Add first location
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {locs.map((loc) => {
            const activeCount = adCountMap[loc.id] ?? 0;
            return (
              <div
                key={loc.id}
                className="bg-white rounded-xl border border-[#D8E4EE] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#F0F7FF] flex items-center justify-center shrink-0 text-[22px]">
                  🏪
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-[15px] text-[#1A3A5C]">{loc.storeName}</span>
                    <Badge
                      variant="outline"
                      className={activeCount > 0
                        ? "bg-green-50 text-green-800 border-green-200 text-[11px] font-semibold"
                        : "bg-slate-100 text-slate-600 border-slate-200 text-[11px] font-semibold"}
                    >
                      {activeCount} active ad{activeCount !== 1 ? "s" : ""}
                    </Badge>
                    {isAdmin && (
                      <Badge variant="outline" className="bg-[#E8EFF6] text-[#1A3A5C] border-[#D8E4EE] text-[11px] font-semibold">
                        {loc.storeOwner.name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[13px] text-[#6B8FA8]">
                    {loc.addressLine1} · {loc.city.name}, {loc.state.code} {loc.postalCode.code}
                  </div>
                  <div className="text-[11px] text-[#9DC4E0] mt-1 font-mono">
                    /display/{loc.slug}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Link
                    href={`/display/${loc.slug}`}
                    target="_blank"
                    className="no-underline text-xs font-semibold text-[#4A90C4] border border-[#4A90C4] px-3 py-1.5 rounded-lg hover:bg-[#4A90C4]/10 transition-colors"
                  >
                    View Display ↗
                  </Link>
                  <Link
                    href={`/dashboard/store-owner/locations/${loc.id}`}
                    className="no-underline text-xs font-semibold text-white bg-[#1A3A5C] px-3.5 py-1.5 rounded-lg hover:bg-[#15304d] transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
