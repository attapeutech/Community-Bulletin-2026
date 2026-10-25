import { db } from "@/lib/db/client";
import { partnerApplications, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { notifyRoles } from "@/lib/notifications";
import { sendPartnerApplicationAdminEmail } from "@/lib/email/templates";
import { HAS_SCREEN, LOCATION_COUNTS, STORE_TYPES, labelFor, type PartnerApplicationInput } from "@/lib/partner-application-schema";

export type SubmitResult =
  | { ok: true; applicationId: string }
  | { ok: false; error: string; status: number };

/** Creates a pending store partner application and tells the admins. */
export async function submitPartnerApplication(userId: string, input: PartnerApplicationInput): Promise<SubmitResult> {
  const [user] = await db
    .select({ name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { ok: false, error: "Account not found", status: 404 };
  if (user.role === "store_owner" || user.role === "admin") {
    return { ok: false, error: "This account is already a store partner", status: 409 };
  }

  const [pending] = await db
    .select({ id: partnerApplications.id })
    .from(partnerApplications)
    .where(and(eq(partnerApplications.userId, userId), eq(partnerApplications.status, "pending")))
    .limit(1);
  if (pending) return { ok: false, error: "You already have an application under review", status: 409 };

  const [created] = await db
    .insert(partnerApplications)
    .values({ userId, ...input, notes: input.notes || null })
    .returning({ id: partnerApplications.id });

  const address = `${input.addressLine1}, ${input.city}, ${input.state} ${input.postalCode}`;
  await notifyRoles(["admin"], {
    type: "partner_application",
    subject: `New store partner application: ${input.businessName}`,
    body: `${input.contactName} · ${address}`,
    link: "/dashboard/admin/applications",
  });
  sendPartnerApplicationAdminEmail({
    businessName: input.businessName,
    contactName: input.contactName,
    email: user.email,
    phone: input.phone,
    address,
    storeType: labelFor(STORE_TYPES, input.storeType),
    locationsCount: labelFor(LOCATION_COUNTS, input.locationsCount),
    hasScreen: labelFor(HAS_SCREEN, input.hasScreen),
  }).catch(console.error);

  console.log(`[Partners] Application ${created.id} submitted by user ${userId}`);
  return { ok: true, applicationId: created.id };
}

/** The user's most recent application, if any (for their dashboard status). */
export async function latestApplicationFor(userId: string) {
  const [row] = await db
    .select({
      id: partnerApplications.id,
      businessName: partnerApplications.businessName,
      status: partnerApplications.status,
      declineReason: partnerApplications.declineReason,
      createdAt: partnerApplications.createdAt,
    })
    .from(partnerApplications)
    .where(eq(partnerApplications.userId, userId))
    .orderBy(desc(partnerApplications.createdAt))
    .limit(1);
  return row ?? null;
}
