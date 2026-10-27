import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { leads, leadNotes } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

const schema = z.object({ body: z.string().trim().min(1, "Write a note first").max(5000) });

// POST /api/admin/leads/[id]/notes — add a note to the lead's history
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const { id } = await params;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    }

    const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });

    await db.insert(leadNotes).values({ leadId: id, authorId: adminId, body: parsed.data.body });
    // A note counts as activity on the lead
    await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/admin/leads/[id]/notes]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
