import type { Metadata } from "next";
import Link from "next/link";
import { getStoreNetwork, formatCities } from "@/lib/network";
import { formatPrice } from "@/lib/pricing";
import { formatShoppers } from "@/lib/traffic";

// Re-read the store list at most once a minute
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stores with Community Bulletin screens",
  description: "Every local store with a Community Bulletin screen: address, shoppers a day and the 4-week ad price.",
  alternates: { canonical: "/stores" },
};

// /stores — every active store ("View all" from the home page's store strip)
export default async function StoresPage() {
  const network = await getStoreNetwork();
  const { stores } = network;

  return (
    <div className="font-sans text-[#1A3A5C] dark:text-[#DEEAF4]">
      <section className="bg-gradient-to-br from-[#1A3A5C] via-[#0F2540] to-[#1A3A5C] px-4 sm:px-8 pt-14 sm:pt-16 pb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold text-[#E8563A] tracking-widest uppercase mb-3">Our stores</div>
          <h1 className="font-serif text-[clamp(28px,4.5vw,46px)] font-bold text-white leading-tight mb-4">
            {stores.length} store{stores.length !== 1 ? "s" : ""} with screens{network.cities.length ? ` in ${formatCities(network.cities)}` : ""}
          </h1>
          {network.storesWithCounts > 0 && (
            <p className="text-[#9DC4E0] text-base sm:text-lg mb-0">
              ~{formatShoppers(network.dailyShoppers)} shoppers a day
              {network.storesWithCounts === stores.length ? " across all of them" : ` at ${network.storesWithCounts} of them`}
              <span className="text-[#9DC4E0]/70 text-xs block mt-1">Shopper counts are store-reported.</span>
            </p>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-8 py-10 sm:py-14 bg-[#F4F7FB] dark:bg-[#0B1A27]">
        <div className="max-w-5xl mx-auto">
          {stores.length === 0 ? (
            <p className="text-center text-[#4A6B82]">No stores yet. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-[#D8E4EE] p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link href={`/stores/${s.slug}`} className="no-underline font-serif text-lg font-bold text-[#1A3A5C] hover:text-[#E8563A] transition-colors">
                      {s.name}
                    </Link>
                    {s.isNew && <span className="shrink-0 bg-[#E8563A] text-white text-[10px] font-bold tracking-wider uppercase rounded-full px-2 py-0.5 mt-1">New</span>}
                  </div>
                  <div className="text-sm text-[#4A6B82]">{s.address}</div>
                  <div className="text-sm text-[#4A6B82] mb-4">{s.city}, {s.stateCode}</div>

                  <div className="flex gap-4 mb-5 text-sm">
                    {s.dailyCustomers && (
                      <div>
                        <div className="font-bold text-[#1A3A5C]">~{formatShoppers(s.dailyCustomers)}</div>
                        <div className="text-xs text-[#5B7D96]">shoppers a day</div>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[#1A3A5C]">{formatPrice(s.priceCents)}</div>
                      <div className="text-xs text-[#5B7D96]">for 4 weeks</div>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Link href={`/ads/new?location=${encodeURIComponent(s.slug)}&from=stores`} className="no-underline flex-1 text-center bg-[#E8563A] hover:bg-[#D14A30] text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors">
                      Post here
                    </Link>
                    <Link href={`/stores/${s.slug}`} className="no-underline text-center border border-[#D8E4EE] hover:bg-[#F0F5FA] text-[#1A3A5C] text-sm font-semibold px-3 py-2 rounded-lg transition-colors">
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
