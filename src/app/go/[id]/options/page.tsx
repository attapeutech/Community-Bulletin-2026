import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads, locations } from "@/lib/db/schema";
import { POSTER_TITLE, qrOffer, readSaleData, saleTitle } from "@/lib/ad-templates";
import CallButton from "./CallButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deal & directions", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The page a shopper sees after scanning a store screen's QR code (when the ad has an address or
// phone): See the deal · Get directions · Call. Each button counts on its own (see /go/[id]).
export default async function QrOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const [ad] = await db
    .select({
      title: ads.title, template: ads.template, templateData: ads.templateData, imageUrl: ads.imageUrl,
      contactWebsite: ads.contactWebsite, contactAddress: ads.contactAddress, contactPhone: ads.contactPhone,
      showWebsite: ads.showWebsite, showAddress: ads.showAddress, showPhone: ads.showPhone,
      storeName: locations.storeName,
    })
    .from(ads)
    .leftJoin(locations, eq(ads.locationId, locations.id))
    .where(eq(ads.id, id))
    .limit(1);
  if (!ad) notFound();

  const offer = qrOffer(ad);
  // Older ads may have a website without the show switch: still offer it here
  const deal = offer.deal || !!ad.contactWebsite?.trim();
  const sale = ad.template === "sale" ? readSaleData(ad.templateData) : null;
  const business = sale?.businessName || (ad.title && ad.title !== POSTER_TITLE ? ad.title : null);
  const offerLine = sale ? saleTitle(sale) : null;
  const address = offer.directions ? ad.contactAddress!.trim() : null;
  const phone = offer.call ? ad.contactPhone!.trim() : null;

  const btn = "flex items-center justify-center gap-3 w-full h-14 rounded-2xl text-[17px] font-bold no-underline shadow-sm active:scale-[0.99] transition-transform";
  return (
    <main className="min-h-[100dvh] bg-[#0F2540] text-white flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-[420px] flex flex-col gap-5">
        {ad.imageUrl && (
          <img src={ad.imageUrl} alt="" className="w-full aspect-[16/10] object-cover rounded-2xl border border-white/10" />
        )}
        <div className="text-center">
          {business && <h1 className="font-serif text-[26px] font-bold leading-tight">{business}</h1>}
          {offerLine && <p className="text-[#F2A58E] text-[18px] font-semibold mt-1">{offerLine}</p>}
          {sale?.ends && <p className="text-white/60 text-[14px] mt-1">{sale.ends}</p>}
        </div>

        <div className="flex flex-col gap-3">
          {deal && (
            <a href={`/go/${id}/deal`} className={`${btn} bg-[#E8563A] text-white`}>
              <span aria-hidden="true">🏷️</span> See the deal
            </a>
          )}
          {address && (
            <a href={`/go/${id}/map`} className={`${btn} bg-white text-[#0F2540]`}>
              <span aria-hidden="true">📍</span> Get directions
            </a>
          )}
          {phone && <CallButton adId={id} phone={phone} className={`${btn} bg-[#1F4A73] text-white border border-white/15`} />}
        </div>

        {address && (
          <div className="text-center text-[14px] text-white/70">
            {address}
            <div className="mt-1">
              <a href={`/go/${id}/map?app=google`} className="text-[#9DC4E0] underline underline-offset-2">Open in Google Maps</a>
              <span className="text-white/30 mx-2">·</span>
              <a href={`/go/${id}/map?app=apple`} className="text-[#9DC4E0] underline underline-offset-2">Apple Maps</a>
            </div>
          </div>
        )}

        <p className="text-center text-[12px] text-white/40 mt-4">
          Seen on the Community Bulletin screen{ad.storeName ? ` at ${ad.storeName}` : ""}
        </p>
      </div>
    </main>
  );
}
