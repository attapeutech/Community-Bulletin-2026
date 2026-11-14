import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getOrMakeProposalLink } from "@/lib/proposal-quick";

// POST /api/admin/proposals/quick { leadId, email? } — admin: the lead's open proposal link, or a new one
// ("Pay now" / "Copy link" on the Sales list)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const parsed = z.object({ leadId: z.string().uuid(), email: z.string().trim().max(200).optional() }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    const result = await getOrMakeProposalLink(parsed.data.leadId, (session.user as any).id as string, parsed.data.email);
    if ("error" in result) return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[POST /api/admin/proposals/quick]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
