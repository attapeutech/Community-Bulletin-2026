import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

const schema = z.discriminatedUnion("payoutMethod", [
  z.object({
    payoutMethod: z.literal("zelle"),
    payoutZelle: z.string().trim().min(3, "Enter your Zelle email or phone").max(120),
  }),
  z.object({
    payoutMethod: z.literal("check"),
    payoutMailingAddress: z.string().trim().min(10, "Enter a full mailing address").max(500),
  }),
]);

// PATCH /api/user/payout-details — store owner sets where their earnings are sent
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    if (role !== "store_owner" && role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 422 }
      );
    }
    const data = parsed.data;

    await db
      .update(users)
      .set({
        payoutMethod: data.payoutMethod,
        payoutZelle: data.payoutMethod === "zelle" ? data.payoutZelle : null,
        payoutMailingAddress: data.payoutMethod === "check" ? data.payoutMailingAddress : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PATCH /api/user/payout-details]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
