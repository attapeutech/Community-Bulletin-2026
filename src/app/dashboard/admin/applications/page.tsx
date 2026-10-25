import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { partnerApplications, users, locations } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import ApplicationsClient, { type ApplicationRow } from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: partnerApplications.id,
      businessName: partnerApplications.businessName,
      contactName: partnerApplications.contactName,
      phone: partnerApplications.phone,
      storeType: partnerApplications.storeType,
      addressLine1: partnerApplications.addressLine1,
      city: partnerApplications.city,
      state: partnerApplications.state,
      postalCode: partnerApplications.postalCode,
      locationsCount: partnerApplications.locationsCount,
      hasScreen: partnerApplications.hasScreen,
      notes: partnerApplications.notes,
      status: partnerApplications.status,
      declineReason: partnerApplications.declineReason,
      createdAt: partnerApplications.createdAt,
      reviewedAt: partnerApplications.reviewedAt,
      locationId: partnerApplications.locationId,
      locationName: locations.storeName,
      userEmail: users.email,
      userName: users.name,
      emailVerified: users.emailVerified,
      agreementStatus: users.partnerAgreementStatus,
      agreementSignedAt: users.partnerAgreementSignedAt,
    })
    .from(partnerApplications)
    .innerJoin(users, eq(partnerApplications.userId, users.id))
    .leftJoin(locations, eq(partnerApplications.locationId, locations.id))
    // Pending first, then newest
    .orderBy(sql`case when ${partnerApplications.status} = 'pending' then 0 else 1 end`, desc(partnerApplications.createdAt));

  const data: ApplicationRow[] = rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    agreementSignedAt: r.agreementSignedAt?.toISOString() ?? null,
  }));

  return <ApplicationsClient applications={data} />;
}
