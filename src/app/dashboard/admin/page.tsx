import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, users, locations, payments } from "@/lib/db/schema";
import { eq, desc, count, sum } from "drizzle-orm";
import AdminPanelClient from "./AdminPanelClient";

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const currentUserId = (session.user as any).id as string;

  // Fetch stats
  const [
    totalAdsRow,
    pendingAdsRow,
    approvedAdsRow,
    deniedAdsRow,
    totalUsersRow,
    totalLocationsRow,
    revenueRow,
  ] = await Promise.all([
    db.select({ count: count() }).from(ads),
    db.select({ count: count() }).from(ads).where(eq(ads.status, "pending")),
    db.select({ count: count() }).from(ads).where(eq(ads.status, "approved")),
    db.select({ count: count() }).from(ads).where(eq(ads.status, "denied")),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(locations),
    db.select({ total: sum(payments.amountCents) }).from(payments).where(eq(payments.status, "paid")),
  ]);

  const stats = {
    totalAds: totalAdsRow[0].count,
    pendingAds: pendingAdsRow[0].count,
    approvedAds: approvedAdsRow[0].count,
    deniedAds: deniedAdsRow[0].count,
    totalUsers: totalUsersRow[0].count,
    totalLocations: totalLocationsRow[0].count,
    totalRevenueCents: Number(revenueRow[0].total ?? 0),
  };

  // Fetch all users
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // Fetch all ads with user + location
  const allAds = await db
    .select({
      id: ads.id,
      title: ads.title,
      imageUrl: ads.imageUrl,
      status: ads.status,
      paymentStatus: ads.paymentStatus,
      reviewNote: ads.reviewNote,
      startedAt: ads.startedAt,
      endedAt: ads.endedAt,
      createdAt: ads.createdAt,
      user: { id: users.id, name: users.name, email: users.email },
      location: { id: locations.id, storeName: locations.storeName, slug: locations.slug },
    })
    .from(ads)
    .innerJoin(users, eq(ads.userId, users.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .orderBy(desc(ads.createdAt))
    .limit(300);

  // Serialize dates
  const serializedUsers = allUsers.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedAds = allAds.map(a => ({
    ...a,
    startedAt: a.startedAt.toISOString(),
    endedAt: a.endedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <AdminPanelClient
      initialStats={stats}
      initialUsers={serializedUsers}
      initialAds={serializedAds}
      currentUserId={currentUserId}
    />
  );
}
