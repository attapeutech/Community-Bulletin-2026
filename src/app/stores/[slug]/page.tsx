import { db } from "@/lib/db/client";
import { locations, users, cities, states, postalCodes, ads, payments } from "@/lib/db/schema";
import { eq, and, count, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";

function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [loc] = await db
    .select({
      id: locations.id,
      storeName: locations.storeName,
      displayName: locations.displayName,
      addressLine1: locations.addressLine1,
      addressLine2: locations.addressLine2,
      slug: locations.slug,
      currency: locations.currency,
      pricePerWeekCents: locations.pricePerWeekCents,
      equipmentProvided: locations.equipmentProvided,
      description: locations.description,
      category: locations.category,
      logoUrl: locations.logoUrl,
      businessHours: locations.businessHours,
      isActive: locations.isActive,
      owner: { name: users.name },
      city: { name: cities.name },
      state: { code: states.code },
      postalCode: { code: postalCodes.code },
    })
    .from(locations)
    .innerJoin(users, eq(locations.storeOwnerId, users.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(and(eq(locations.slug, slug), eq(locations.isActive, true)))
    .limit(1);

  if (!loc) notFound();

  const [adCountRow] = await db
    .select({ total: count() })
    .from(ads)
    .where(and(eq(ads.locationId, loc.id), eq(ads.status, "approved")));

  const activeAdCount = adCountRow?.total ?? 0;

  const displayName = loc.displayName || loc.storeName;
  const address = [loc.addressLine1, loc.addressLine2].filter(Boolean).join(", ");
  const cityLine = `${loc.city.name}, ${loc.state.code} ${loc.postalCode.code}`;
  const shareRate = loc.equipmentProvided ? "50%" : "25%";

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Nav bar */}
      <header className="bg-white border-b border-[#D8E4EE] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="bg-[#E8EFF6] rounded-lg p-1">
              <Icon size={22} />
            </div>
            <span className="font-serif font-bold text-[13px] text-[#1A3A5C] leading-tight">
              Community<span className="text-[#E8563A]">Bulletin</span>
            </span>
          </Link>
          <Link
            href={`/ads/new?locationId=${loc.id}`}
            className="bg-[#E8563A] text-white text-sm font-semibold px-4 py-2 rounded-lg no-underline hover:bg-[#d14a30] transition-colors"
          >
            Advertise Here
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-[#D8E4EE] overflow-hidden mb-6">
          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#1A3A5C] to-[#4A90C4]" />
          <div className="p-6 sm:p-8 flex gap-6 flex-wrap items-start">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-[#F0F7FF] border border-[#D8E4EE] flex items-center justify-center overflow-hidden shrink-0">
              {loc.logoUrl
                ? <img src={loc.logoUrl} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-4xl">🏪</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A3A5C]">{displayName}</h1>
                {loc.category && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider bg-[#EEF2FF] text-[#3730A3] px-2.5 py-1 rounded-full">
                    {loc.category}
                  </span>
                )}
              </div>
              <div className="text-[#6B8FA8] text-sm mb-1">{address}</div>
              <div className="text-[#6B8FA8] text-sm">{cityLine}</div>
              {loc.description && (
                <p className="mt-4 text-[#4A5568] text-[14px] leading-relaxed">{loc.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Pricing */}
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-5">
            <div className="text-[10px] font-semibold text-[#6B8FA8] uppercase tracking-wider mb-2">Ad Price</div>
            <div className="text-2xl font-bold text-[#1A3A5C]">{formatCents(loc.pricePerWeekCents, loc.currency)}</div>
            <div className="text-[12px] text-[#9DC4E0] mt-0.5">per week</div>
          </div>
          {/* Active ads */}
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-5">
            <div className="text-[10px] font-semibold text-[#6B8FA8] uppercase tracking-wider mb-2">Currently Running</div>
            <div className="text-2xl font-bold text-[#1A3A5C]">{activeAdCount}</div>
            <div className="text-[12px] text-[#9DC4E0] mt-0.5">active ad{activeAdCount !== 1 ? "s" : ""}</div>
          </div>
          {/* Revenue share (for context) */}
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-5">
            <div className="text-[10px] font-semibold text-[#6B8FA8] uppercase tracking-wider mb-2">Display Setup</div>
            <div className="text-2xl font-bold text-[#1A3A5C]">
              {loc.equipmentProvided ? "In-store TV" : "Provided"}
            </div>
            <div className="text-[12px] text-[#9DC4E0] mt-0.5">
              {loc.equipmentProvided ? "store-owned equipment" : "platform equipment"}
            </div>
          </div>
        </div>

        {/* Business hours */}
        {loc.businessHours && (
          <div className="bg-white rounded-xl border border-[#D8E4EE] p-5 mb-6">
            <h2 className="font-serif text-[16px] font-bold text-[#1A3A5C] mb-3">Business Hours</h2>
            <pre className="text-sm text-[#4A5568] font-sans whitespace-pre-wrap leading-relaxed">{loc.businessHours}</pre>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#1A3A5C] to-[#2a5a8c] rounded-2xl p-8 text-center text-white">
          <h2 className="font-serif text-2xl font-bold mb-2">Ready to reach local customers?</h2>
          <p className="text-[#9DC4E0] text-sm mb-6 max-w-md mx-auto">
            Your ad will be displayed on the in-store screen at {displayName} — seen by every customer who walks in.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={`/ads/new?locationId=${loc.id}`}
              className="bg-[#E8563A] text-white text-sm font-semibold px-6 py-3 rounded-xl no-underline hover:bg-[#d14a30] transition-colors"
            >
              Post an Ad Here — {formatCents(loc.pricePerWeekCents, loc.currency)}/week
            </Link>
            <Link
              href="/ads/new"
              className="bg-white/10 text-white text-sm font-semibold px-6 py-3 rounded-xl no-underline hover:bg-white/20 transition-colors border border-white/20"
            >
              Browse All Locations
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
