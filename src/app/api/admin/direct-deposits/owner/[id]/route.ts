import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";

// Either or both: the Zelle/check exception, and the partner agreement status (payouts are held until "signed")
const schema = z.object({
  manualPayoutAllowed: z.boolean().optional(),
  agreementStatus: z.enum(["not_sent", "sent", "signed"]).optional(),
}).refine(b => b.manualPayoutAllowed !== undefined || b.agreementStatus !== undefined);

// PATCH /api/admin/direct-deposits/owner/[id] — admin: allow (or stop) paying this owner by Zelle/check,
// and track their partner agreement (also settable on Applications, but owners set up from a Sales lead have no application)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });

    const [updated] = await db
      .update(users)
      .set({
        ...(parsed.data.manualPayoutAllowed !== undefined && { manualPayoutAllowed: parsed.data.manualPayoutAllowed }),
        ...(parsed.data.agreementStatus && {
          partnerAgreementStatus: parsed.data.agreementStatus,
          partnerAgreementSignedAt: parsed.data.agreementStatus === "signed" ? new Date() : null,
        }),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.role, "store_owner")))
      .returning({ id: users.id });
    if (!updated) return NextResponse.json({ success: false, error: "Store owner not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/direct-deposits/owner/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
