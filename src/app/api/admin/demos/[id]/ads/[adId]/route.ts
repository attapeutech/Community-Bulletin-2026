import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { saleTemplateSchema, saleTitle } from "@/lib/ad-templates";

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

// The demo ad, only when it belongs to this demo
async function findDemoAd(demoId: string, adId: string) {
  if (!isUuid(demoId) || !isUuid(adId)) return null;
  const [ad] = await db
    .select({
      id: ads.id,
      title: ads.title,
      description: ads.description,
      imageUrl: ads.imageUrl,
      imageKey: ads.imageKey,
      template: ads.template,
      templateData: ads.templateData,
      contactPhone: ads.contactPhone,
      contactAddress: ads.contactAddress,
      contactWebsite: ads.contactWebsite,
      showPhone: ads.showPhone,
      showAddress: ads.showAddress,
      showWebsite: ads.showWebsite,
    })
    .from(ads)
    .where(and(eq(ads.id, adId), eq(ads.demoId, demoId)))
    .limit(1);
  return ad ?? null;
}

// GET /api/admin/demos/[id]/ads/[adId] — a demo ad's fields, for editing it in Post a New Ad
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; adId: string }> }) {
  try {
    await requireAdmin();
    const { id, adId } = await params;
    const ad = await findDemoAd(id, adId);
    if (!ad) return NextResponse.json({ success: false, error: "Demo ad not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: ad });
  } catch (error) {
    console.error("[GET /api/admin/demos/[id]/ads/[adId]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// The same fields as posting an ad (store, payment and status don't change)
const editSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  imageKey: z.string().min(1),
  contactPhone:   z.string().max(30).optional(),
  contactAddress: z.string().max(200).optional(),
  contactWebsite: z.string().max(200).optional(),
  showPhone:   z.boolean().optional(),
  showAddress: z.boolean().optional(),
  showWebsite: z.boolean().optional(),
  template: z.literal("sale").optional(),
  templateData: z.unknown().optional(),
});

// PATCH /api/admin/demos/[id]/ads/[adId] — change a demo ad's design, image and details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; adId: string }> }) {
  try {
    await requireAdmin();
    const { id, adId } = await params;
    if (!(await findDemoAd(id, adId))) return NextResponse.json({ success: false, error: "Demo ad not found" }, { status: 404 });

    const parsed = editSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    const data = parsed.data;

    // Template ads: check the fields; the title is built from them, as when posting
    let templateData = null;
    if (data.template === "sale") {
      const t = saleTemplateSchema.safeParse(data.templateData);
      if (!t.success) return NextResponse.json({ success: false, error: t.error.issues[0]?.message ?? "Template details are incomplete" }, { status: 422 });
      templateData = t.data;
      data.title = saleTitle(templateData).slice(0, 120);
      data.description = templateData.details || undefined;
    }

    await db.update(ads).set({
      title: data.title,
      description: data.description ?? null,
      imageUrl: data.imageUrl,
      imageKey: data.imageKey,
      template: data.template ?? null,
      templateData,
      contactPhone:   data.contactPhone   ?? null,
      contactAddress: data.contactAddress ?? null,
      contactWebsite: data.contactWebsite ?? null,
      showPhone:   data.showPhone   ?? false,
      showAddress: data.showAddress ?? false,
      showWebsite: data.showWebsite ?? false,
      updatedAt: new Date(),
    }).where(eq(ads.id, adId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/demos/[id]/ads/[adId]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
