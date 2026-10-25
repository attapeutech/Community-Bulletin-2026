import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { partnerApplications, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { notifyUser } from "@/lib/notifications";
import { sendPartnerApprovedEmail, sendPartnerDeclinedEmail } from "@/lib/email/templates";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("decline"), reason: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal("agreement"), status: z.enum(["not_sent", "sent", "signed"]) }),
]);

// PATCH /api/admin/applications/[id] — approve, decline, or update the partner's agreement status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const { id } = await params;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    const body = parsed.data;

    const [app] = await db
      .select({
        id: partnerApplications.id,
        status: partnerApplications.status,
        businessName: partnerApplications.businessName,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        agreementStatus: users.partnerAgreementStatus,
      })
      .from(partnerApplications)
      .innerJoin(users, eq(partnerApplications.userId, users.id))
      .where(eq(partnerApplications.id, id))
      .limit(1);
    if (!app) return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });

    const now = new Date();

    if (body.action === "approve") {
      if (app.status !== "pending") return NextResponse.json({ success: false, error: "Already reviewed" }, { status: 409 });
      await db.update(partnerApplications)
        .set({ status: "approved", reviewedBy: adminId, reviewedAt: now, updatedAt: now })
        .where(eq(partnerApplications.id, id));
      await db.update(users)
        .set({
          // Advertisers become store owners; approvers/admins keep their (broader) role
          ...(app.userRole === "user" && { role: "store_owner" as const }),
          ...(app.agreementStatus === null && { partnerAgreementStatus: "not_sent" }),
          updatedAt: now,
        })
        .where(eq(users.id, app.userId));
      await notifyUser(app.userId, {
        type: "partner_approved",
        subject: `${app.businessName} is approved as a store partner`,
        body: "We'll be in touch to set up your screen and send your agreement.",
        link: "/dashboard/store-owner",
      });
      sendPartnerApprovedEmail({ to: app.userEmail, name: app.userName, businessName: app.businessName }).catch(console.error);
      console.log(`[Partners] Application ${id} approved by admin ${adminId}`);
      return NextResponse.json({ success: true });
    }

    if (body.action === "decline") {
      if (app.status !== "pending") return NextResponse.json({ success: false, error: "Already reviewed" }, { status: 409 });
      const reason = body.reason || null;
      await db.update(partnerApplications)
        .set({ status: "declined", declineReason: reason, reviewedBy: adminId, reviewedAt: now, updatedAt: now })
        .where(eq(partnerApplications.id, id));
      await notifyUser(app.userId, {
        type: "partner_declined",
        subject: `Update on your store partner application`,
        body: reason ?? "We're not able to move forward at this time.",
        link: "/dashboard/user",
      });
      sendPartnerDeclinedEmail({ to: app.userEmail, name: app.userName, businessName: app.businessName, reason }).catch(console.error);
      console.log(`[Partners] Application ${id} declined by admin ${adminId}`);
      return NextResponse.json({ success: true });
    }

    // Agreement status lives on the partner's account (payouts are held until "signed")
    await db.update(users)
      .set({
        partnerAgreementStatus: body.status,
        partnerAgreementSignedAt: body.status === "signed" ? now : null,
        updatedAt: now,
      })
      .where(eq(users.id, app.userId));
    console.log(`[Partners] Agreement for user ${app.userId} set to ${body.status} by admin ${adminId}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PATCH /api/admin/applications/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/applications/[id] — prefill data for setting up the applicant's store
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [app] = await db
      .select({
        id: partnerApplications.id,
        status: partnerApplications.status,
        businessName: partnerApplications.businessName,
        addressLine1: partnerApplications.addressLine1,
        city: partnerApplications.city,
        state: partnerApplications.state,
        postalCode: partnerApplications.postalCode,
        hasScreen: partnerApplications.hasScreen,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(partnerApplications)
      .innerJoin(users, eq(partnerApplications.userId, users.id))
      .where(eq(partnerApplications.id, id))
      .limit(1);
    if (!app) return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: app });
  } catch (error: any) {
    console.error("[GET /api/admin/applications/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
