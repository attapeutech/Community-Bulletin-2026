import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { leads, leadNotes, locations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { LEAD_KIND_VALUES, LEAD_SOURCE_VALUES } from "@/lib/leads";

// Optional text field: trimmed, "" stored as null
const optText = (max: number) => z.string().trim().max(max).optional().transform(v => v || null);

const schema = z.object({
  kind: z.enum(LEAD_KIND_VALUES).default("advertiser"),
  locationId: z.string().uuid().nullable().optional(),
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  contactName: optText(200),
  phone: optText(50),
  email: z.string().trim().max(200).optional().transform(v => v || null).pipe(z.string().email("Enter a valid email").nullable()),
  city: optText(100),
  address: optText(300),
  source: z.enum(LEAD_SOURCE_VALUES).optional().nullable(),
  nextFollowUp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  note: optText(5000),
});

// POST /api/admin/leads — add a lead (owned by the admin who adds it)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    }
    const { note, ...fields } = parsed.data;

    if (fields.locationId) {
      const [loc] = await db.select({ id: locations.id }).from(locations).where(eq(locations.id, fields.locationId)).limit(1);
      if (!loc) return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    const [lead] = await db.insert(leads).values({
      ...fields,
      source: fields.source ?? null,
      nextFollowUp: fields.nextFollowUp ?? null,
      locationId: fields.locationId ?? null,
      ownerId: adminId,
    }).returning({ id: leads.id });

    if (note) await db.insert(leadNotes).values({ leadId: lead.id, authorId: adminId, body: note });

    return NextResponse.json({ success: true, data: { id: lead.id } });
  } catch (error: any) {
    console.error("[POST /api/admin/leads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
