import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

const editSchema = z.object({
  title:          z.string().min(1).max(200).optional(),
  description:    z.string().max(1000).nullable().optional(),
  status:         z.enum(["pending", "approved", "denied", "expired", "cancelled"]).optional(),
  paymentStatus:  z.enum(["unpaid", "paid", "refunded", "refund_pending", "failed"]).optional(),
  startedAt:      z.string().datetime().optional(),
  endedAt:        z.string().datetime().optional(),
  imageUrl:       z.string().url().optional(),
  displayOrder:   z.number().int().min(0).optional(),
  contactPhone:   z.string().max(50).nullable().optional(),
  contactAddress: z.string().max(300).nullable().optional(),
  contactWebsite: z.string().max(500).nullable().optional(),
  showPhone:      z.boolean().optional(),
  showAddress:    z.boolean().optional(),
  showWebsite:    z.boolean().optional(),
});

// PATCH /api/admin/ads/[id] — admin direct field edit, no emails or refunds
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const fields = editSchema.parse(body);

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 422 });
    }

    // Fetch current ad to enforce consistency rules
    const [current] = await db.select({ status: ads.status, paymentStatus: ads.paymentStatus })
      .from(ads).where(eq(ads.id, id)).limit(1);

    if (!current) {
      return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    }

    const resultingStatus        = fields.status        ?? current.status;
    const resultingPaymentStatus = fields.paymentStatus ?? current.paymentStatus;

    // An approved ad must have paid status — if not, demote to pending
    if (resultingStatus === "approved" && resultingPaymentStatus !== "paid") {
      fields.status = "pending";
    }

    const [updated] = await db
      .update(ads)
      .set({
        ...fields,
        startedAt: fields.startedAt ? new Date(fields.startedAt) : undefined,
        endedAt:   fields.endedAt   ? new Date(fields.endedAt)   : undefined,
        updatedAt: new Date(),
      })
      .where(eq(ads.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Ad not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 422 });
    }
    console.error("[PATCH /api/admin/ads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
