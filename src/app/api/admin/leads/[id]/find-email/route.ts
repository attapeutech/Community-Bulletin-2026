import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { findEmails } from "@/lib/find-email";

export const dynamic = "force-dynamic";

// POST /api/admin/leads/[id]/find-email — admin: emails published on the lead's website (not saved;
// the salesperson picks one, which is saved through the normal lead edit)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    const [lead] = await db.select({ website: leads.website }).from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    if (!lead.website) return NextResponse.json({ success: false, error: "This lead has no website to check" }, { status: 422 });
    const emails = await findEmails(lead.website).catch(() => [] as string[]);
    return NextResponse.json({ success: true, data: { emails } });
  } catch (error) {
    console.error("[POST /api/admin/leads/[id]/find-email]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
