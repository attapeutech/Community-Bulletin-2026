import { requireApproverOrAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, adSwaps, locations, users, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import ApproverQueueClient from "./ApproverQueueClient";

export default async function ApproverDashboard() {
  await requireApproverOrAdmin();

  const pending = await db
    .select({
      id: ads.id,
      title: ads.title,
      description: ads.description,
      imageUrl: ads.imageUrl,
      template: ads.template,
      templateData: ads.templateData,
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

  // Ad swaps: a new version of a running paid ad (the current one keeps running until approved)
  const swaps = await db
    .select({
      id: adSwaps.id,
      title: adSwaps.title,
      description: adSwaps.description,
      imageUrl: adSwaps.imageUrl,
      template: adSwaps.template,
      templateData: adSwaps.templateData,
      createdAt: adSwaps.createdAt,
      contactPhone:   adSwaps.contactPhone,
      contactAddress: adSwaps.contactAddress,
      contactWebsite: adSwaps.contactWebsite,
      showPhone:   adSwaps.showPhone,
      showAddress: adSwaps.showAddress,
      showWebsite: adSwaps.showWebsite,
      current: { id: ads.id, title: ads.title, imageUrl: ads.imageUrl, endedAt: ads.endedAt },
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
    .from(adSwaps)
    .innerJoin(ads, eq(adSwaps.adId, ads.id))
    .innerJoin(users, eq(ads.userId, users.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    // Only while the ad is still running (an ended or cancelled ad's swap can't be approved)
    .where(and(eq(adSwaps.status, "pending"), eq(ads.status, "approved"), gt(ads.endedAt, new Date())));

  // Serialize Date objects to ISO strings before crossing the server→client boundary; newest first
  const serialized = [
    ...pending.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    ...swaps.map(({ current, ...s }) => ({
      ...s,
      status: "pending",
      paymentStatus: "paid",
      createdAt: s.createdAt.toISOString(),
      swap: { adId: current.id, title: current.title, imageUrl: current.imageUrl, endedAt: current.endedAt.toISOString() },
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <ApproverQueueClient initialAds={serialized} />;
}
