import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users, ownerEarnings, payouts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq, and, inArray } from "drizzle-orm";
import { sendPayoutSentEmail } from "@/lib/email/templates";
import { notifyPayoutSent } from "@/lib/notifications";

const schema = z.object({
  ownerId: z.string().uuid(),
  method: z.enum(["zelle", "check"]),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  expectedCents: z.number().int().positive(),  // what the admin saw; guards against paying a changed balance
});

class BalanceChanged extends Error {}

// POST /api/admin/payouts — record a manual payout of an owner's full available balance
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
    }
    const { ownerId, method, reference, note, expectedCents } = parsed.data;

    // Payouts are held until the store partner agreement is signed (null = not tracked, e.g. older partners)
    const [ownerRow] = await db.select({ agreement: users.partnerAgreementStatus }).from(users).where(eq(users.id, ownerId)).limit(1);
    if (ownerRow?.agreement === "not_sent" || ownerRow?.agreement === "sent") {
      return NextResponse.json(
        { success: false, error: "This partner hasn't signed their agreement yet. Mark it signed on the Applications page first." },
        { status: 409 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: ownerEarnings.id, amountCents: ownerEarnings.amountCents, currency: ownerEarnings.currency })
        .from(ownerEarnings)
        .where(and(eq(ownerEarnings.ownerId, ownerId), eq(ownerEarnings.status, "available")))
        .for("update");

      const total = rows.reduce((s, r) => s + (r.amountCents ?? 0), 0);
      if (rows.length === 0 || total !== expectedCents) throw new BalanceChanged();

      const [payout] = await tx
        .insert(payouts)
        .values({
          ownerId,
          amountCents: total,
          currency: rows[0].currency,
          method,
          reference: reference || null,
          note: note || null,
          createdBy: adminId,
        })
        .returning();

      await tx
        .update(ownerEarnings)
        .set({ status: "paid", payoutId: payout.id, updatedAt: new Date() })
        .where(inArray(ownerEarnings.id, rows.map(r => r.id)));

      return { payout, count: rows.length };
    });

    await notifyPayoutSent(ownerId, result.payout.amountCents, method);

    const [owner] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);

    if (owner) {
      sendPayoutSentEmail({
        to: owner.email,
        ownerName: owner.name,
        amountFormatted: `$${(result.payout.amountCents / 100).toFixed(2)}`,
        method,
        reference: reference || null,
        adCount: result.count,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: result.payout });
  } catch (error: any) {
    if (error instanceof BalanceChanged) {
      return NextResponse.json(
        { success: false, error: "This owner's balance changed. Refresh the page and try again." },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/payouts]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
