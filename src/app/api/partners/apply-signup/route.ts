import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { partnerApplicationSchema } from "@/lib/partner-application-schema";
import { submitPartnerApplication } from "@/lib/partner-applications";

// Accounts created this recently (and not yet email-confirmed) can attach an application at sign-up
const SIGNUP_WINDOW_MS = 30 * 60 * 1000;

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  application: partnerApplicationSchema,
});

// POST /api/partners/apply-signup — public; called by the register form right after sign-up,
// before the user can log in (email confirmation comes first).
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.email, parsed.data.email),
        eq(users.emailVerified, false),
        gte(users.createdAt, new Date(Date.now() - SIGNUP_WINDOW_MS)),
      ))
      .limit(1);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to apply as a store partner" }, { status: 403 });
    }

    const result = await submitPartnerApplication(user.id, parsed.data.application);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/partners/apply-signup]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
