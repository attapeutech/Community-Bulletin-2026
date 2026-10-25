import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { partnerApplicationSchema } from "@/lib/partner-application-schema";
import { submitPartnerApplication } from "@/lib/partner-applications";

// POST /api/partners/apply — a signed-in user applies to become a store partner
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ success: false, error: "Sign in to apply" }, { status: 401 });

    const parsed = partnerApplicationSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    }

    const result = await submitPartnerApplication(userId, parsed.data);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, data: { applicationId: result.applicationId } }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/partners/apply]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
