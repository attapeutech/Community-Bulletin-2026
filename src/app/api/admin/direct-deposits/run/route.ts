import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { stripeConnectEnabled } from "@/lib/stripe";
import { runDirectDeposits } from "@/lib/direct-deposits";

// POST /api/admin/direct-deposits/run — admin: pay every eligible owner now instead of waiting for the 15th
export async function POST() {
  try {
    const session = await requireAdmin();
    if (!stripeConnectEnabled()) {
      return NextResponse.json({ success: false, error: "Direct deposits are switched off." }, { status: 404 });
    }
    const summary = await runDirectDeposits({ trigger: "manual", adminId: (session.user as any).id as string });
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("[POST /api/admin/direct-deposits/run]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
