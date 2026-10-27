import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { leads, leadNotes, locations, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq, sql } from "drizzle-orm";
import { LEAD_KIND_VALUES, LEAD_SOURCE_VALUES, LEAD_STAGE_VALUES, stageLabel } from "@/lib/leads";

const optText = (max: number) => z.string().trim().max(max).nullable().optional().transform(v => (v === undefined ? undefined : v || null));

// Every field is optional: the list's quick actions send one or two, the edit form sends the details
const schema = z.object({
  kind: z.enum(LEAD_KIND_VALUES).optional(),
  // Advertiser: target store. Store lead: the location it became. null clears it.
  locationId: z.string().uuid().nullable().optional(),
  businessName: z.string().trim().min(1, "Business name is required").max(200).optional(),
  contactName: optText(200),
  phone: optText(50),
  email: optText(200).pipe(z.string().email("Enter a valid email").nullable().optional()),
  city: optText(100),
  address: optText(300),
  source: z.enum(LEAD_SOURCE_VALUES).nullable().optional(),
  stage: z.enum(LEAD_STAGE_VALUES).optional(),
  lostReason: optText(500),
  nextFollowUp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  // Link the customer account this lead became (by its email); null unlinks
  linkEmail: z.string().trim().max(200).nullable().optional(),
});

// PATCH /api/admin/leads/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const { id } = await params;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    }
    const { linkEmail, stage, lostReason, ...fields } = parsed.data;

    const [lead] = await db.select({ id: leads.id, stage: leads.stage }).from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });

    if (fields.locationId) {
      const [loc] = await db.select({ id: locations.id }).from(locations).where(eq(locations.id, fields.locationId)).limit(1);
      if (!loc) return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    const now = new Date();
    const set: Partial<typeof leads.$inferInsert> = { updatedAt: now };
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) (set as any)[k] = v;

    if (linkEmail !== undefined) {
      if (linkEmail) {
        const [user] = await db.select({ id: users.id }).from(users)
          .where(eq(sql`lower(${users.email})`, linkEmail.toLowerCase())).limit(1);
        if (!user) return NextResponse.json({ success: false, error: "No account found with that email" }, { status: 404 });
        set.userId = user.id;
      } else {
        set.userId = null;
      }
    }

    const stageChanged = stage !== undefined && stage !== lead.stage;
    if (stageChanged) {
      set.stage = stage;
      set.wonAt = stage === "won" ? now : null;
      set.lostReason = stage === "lost" ? lostReason ?? null : null;
      // Finished leads don't need a follow-up
      if (stage === "won" || stage === "lost") set.nextFollowUp = null;
    } else if (lostReason !== undefined && lead.stage === "lost") {
      set.lostReason = lostReason;
    }

    await db.update(leads).set(set).where(eq(leads.id, id));

    if (stageChanged) {
      const reason = stage === "lost" && lostReason ? ` (${lostReason})` : "";
      await db.insert(leadNotes).values({
        leadId: id,
        authorId: adminId,
        body: `Stage: ${stageLabel(lead.stage)} → ${stageLabel(stage!)}${reason}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PATCH /api/admin/leads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/leads/[id] — removes the lead and its notes
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.delete(leads).where(eq(leads.id, id)).returning({ id: leads.id });
    if (deleted.length === 0) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/admin/leads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/leads/[id] — prefill for setting up a store lead's location
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [lead] = await db
      .select({
        id: leads.id,
        kind: leads.kind,
        businessName: leads.businessName,
        address: leads.address,
        city: leads.city,
        locationId: leads.locationId,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(leads)
      .leftJoin(users, eq(leads.userId, users.id))
      .where(eq(leads.id, id))
      .limit(1);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    console.error("[GET /api/admin/leads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
