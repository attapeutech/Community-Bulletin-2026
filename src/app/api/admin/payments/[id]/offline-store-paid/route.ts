import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { payments } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

const schema = z.object({
  // null clears it
  amountCents: z.number().int().min(1).max(1_000_000).nullable(),
  method: z.enum(["cash", "zelle", "check"]).optional(),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().trim().max(300).optional(),
});

// PATCH /api/admin/payments/[id]/offline-store-paid — record what the store owner was paid outside the system
// for this ad (cash, Zelle, check), so CB's Revenue numbers are right
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    const d = parsed.data;

    const [payment] = await db.select({ amountCents: payments.amountCents, taxCents: payments.taxCents }).from(payments).where(eq(payments.id, id)).limit(1);
    if (!payment) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (d.amountCents !== null && d.amountCents > payment.amountCents - payment.taxCents) {
      return NextResponse.json({ success: false, error: "That's more than the ad price." }, { status: 422 });
    }

    await db.update(payments).set(d.amountCents === null
      ? { offlineStorePaidCents: null, offlineStorePaidMethod: null, offlineStorePaidOn: null, offlineStorePaidNote: null, updatedAt: new Date() }
      : {
          offlineStorePaidCents: d.amountCents,
          offlineStorePaidMethod: d.method ?? "cash",
          offlineStorePaidOn: d.paidOn ?? null,
          offlineStorePaidNote: d.note || null,
          updatedAt: new Date(),
        }).where(eq(payments.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/payments/[id]/offline-store-paid]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
