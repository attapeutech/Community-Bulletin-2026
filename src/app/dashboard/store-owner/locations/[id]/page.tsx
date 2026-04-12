import { requireStoreOwner, getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { locations, ads, users, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import LocationDetailClient from "./LocationDetailClient";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireStoreOwner();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isAdmin = role === "admin";

  const [loc] = await db
    .select({
      id: locations.id,
      storeName: locations.storeName,
      addressLine1: locations.addressLine1,
      addressLine2: locations.addressLine2,
      displayName: locations.displayName,
      slug: locations.slug,
      currency: locations.currency,
      isActive: locations.isActive,
      storeOwnerId: locations.storeOwnerId,
      city: { name: cities.name },
      state: { code: states.code },
      postalCode: { code: postalCodes.code },
    })
    .from(locations)
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(eq(locations.id, id))
    .limit(1);

  if (!loc) notFound();
  if (!isAdmin && loc.storeOwnerId !== userId) notFound();

  // Fetch all ads at this location
  const locationAds = await db
    .select({
      id: ads.id,
      title: ads.title,
      imageUrl: ads.imageUrl,
      status: ads.status,
      paymentStatus: ads.paymentStatus,
      displayOrder: ads.displayOrder,
      startedAt: ads.startedAt,
      endedAt: ads.endedAt,
      createdAt: ads.createdAt,
      user: { id: users.id, name: users.name, email: users.email },
    })
    .from(ads)
    .innerJoin(users, eq(ads.userId, users.id))
    .where(eq(ads.locationId, id))
    .orderBy(asc(ads.displayOrder), desc(ads.createdAt));

  // Serialize dates and coerce nullable fields
  const serializedAds = locationAds.map((a) => ({
    ...a,
    displayOrder: a.displayOrder ?? 0,
    startedAt: a.startedAt.toISOString(),
    endedAt: a.endedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <LocationDetailClient
      location={loc}
      initialAds={serializedAds}
      isAdmin={isAdmin}
    />
  );
}
