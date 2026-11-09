import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, demos, leads, locations } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { formatPrice } from "@/lib/pricing";
import { defaultProposalMessage } from "@/lib/proposals";
import ProposalComposer from "./ProposalComposer";

export const dynamic = "force-dynamic";

// Sales → lead → Ad demos → Send proposal: email or text the advertiser a demo ad they can pay for
export default async function ProposalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ demo?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { demo: demoId } = await searchParams;
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(id) || !demoId || !uuid.test(demoId)) notFound();

  const [row] = await db
    .select({
      leadId: leads.id,
      businessName: leads.businessName,
      contactName: leads.contactName,
      email: leads.email,
      phone: leads.phone,
      demoToken: demos.token,
      expiresAt: demos.expiresAt,
      storeName: locations.storeName,
      storeSlug: locations.slug,
      price: locations.pricePerRunCents,
      shoppers: locations.dailyCustomers,
    })
    .from(demos)
    .innerJoin(leads, eq(demos.leadId, leads.id))
    .innerJoin(locations, eq(demos.locationId, locations.id))
    .where(and(eq(demos.id, demoId), eq(demos.leadId, id)))
    .limit(1);
  if (!row) notFound();

  const demoAds = await db.select({ id: ads.id, title: ads.title, imageUrl: ads.imageUrl }).from(ads).where(eq(ads.demoId, demoId)).orderBy(asc(ads.createdAt));
  const price = formatPrice(row.price);

  return (
    <ProposalComposer
      demoId={demoId}
      lead={{ id: row.leadId, businessName: row.businessName, contactName: row.contactName, email: row.email ?? "", phone: row.phone }}
      store={{ name: row.storeName, slug: row.storeSlug }}
      demoToken={row.demoToken}
      expired={row.expiresAt < new Date()}
      expiresAt={row.expiresAt.toISOString()}
      price={price}
      demoAds={demoAds}
      defaults={{
        subject: `Your ad at ${row.storeName} is ready to see`,
        message: defaultProposalMessage({ contactName: row.contactName, businessName: row.businessName, storeName: row.storeName, shoppers: row.shoppers, price }),
      }}
    />
  );
}
