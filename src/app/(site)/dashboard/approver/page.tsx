import { requireApproverOrAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, locations, users, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import ApproverQueueClient from "./ApproverQueueClient";

export default async function ApproverDashboard() {
  await requireApproverOrAdmin();

  const pending = await db
    .select({
      id: ads.id,
      title: ads.title,
      description: ads.description,
      imageUrl: ads.imageUrl,
      status: ads.status,
      paymentStatus: ads.paymentStatus,
      createdAt: ads.createdAt,
      contactPhone:   ads.contactPhone,
      contactAddress: ads.contactAddress,
      contactWebsite: ads.contactWebsite,
      showPhone:   ads.showPhone,
      showAddress: ads.showAddress,
      showWebsite: ads.showWebsite,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
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
    .where(
      and(
        eq(ads.status, "pending"),
        eq(ads.paymentStatus, "paid")
      )
    )
    .orderBy(desc(ads.createdAt));

  // Serialize Date objects to ISO strings before crossing the server→client boundary
  const serialized = pending.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return <ApproverQueueClient initialAds={serialized} />;
}
