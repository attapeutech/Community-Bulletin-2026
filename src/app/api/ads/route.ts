import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads, locations, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { AD_DURATION_DAYS } from "@/types";
import { addDays } from "date-fns";
import { pushDashboardUpdate } from "@/lib/socket/notify";
import { saleTemplateSchema, saleTitle } from "@/lib/ad-templates";

const createAdSchema = z.object({
  locationId: z.string().uuid(),
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
  // Admin only: a test ad skips payment and review and shows only on display previews (?preview=)
  isTest: z.boolean().optional(),
  // Built-in template drawn by the screen (the image is then the template's photo)
  template: z.literal("sale").optional(),
  templateData: z.unknown().optional(),
});

// POST /api/ads — create a new ad (status=pending, paymentStatus=unpaid)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const data = createAdSchema.parse(body);
    if (data.isTest && (session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Only admins can post test ads" }, { status: 403 });
    }
    // Template ads: check the fields; the title shown elsewhere is built from them ("20% OFF any large pizza")
    let templateData = null;
    if (data.template === "sale") {
      const parsedTemplate = saleTemplateSchema.safeParse(data.templateData);
      if (!parsedTemplate.success) {
        return NextResponse.json({ success: false, error: parsedTemplate.error.issues[0]?.message ?? "Template details are incomplete" }, { status: 422 });
      }
      templateData = parsedTemplate.data;
      data.title = saleTitle(templateData).slice(0, 120);
      data.description = templateData.details || undefined;
    }

    // Verify location exists and is active
    const [location] = await db
      .select({ id: locations.id, slug: locations.slug })
      .from(locations)
      .where(and(eq(locations.id, data.locationId), eq(locations.isActive, true)))
      .limit(1);

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Location not found or inactive" },
        { status: 404 }
      );
    }

    const now = new Date();
    const [ad] = await db
      .insert(ads)
      .values({
        userId,
        locationId: data.locationId,
        title: data.title,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        imageKey: data.imageKey,
        // Test ads are approved straight away but stay unpaid, so every "paid ads" query (store screens,
        // Live Ads, the public ad page, earnings) ignores them; only display previews include them
        status: data.isTest ? "approved" : "pending",
        paymentStatus: "unpaid",
        isTest: data.isTest ?? false,
        template: data.template ?? null,
        templateData,
        reviewedBy: data.isTest ? userId : null,
        reviewedAt: data.isTest ? now : null,
        startedAt: now,
        endedAt: addDays(now, AD_DURATION_DAYS),
        displayOrder: 0,
        contactPhone:   data.contactPhone   ?? null,
        contactAddress: data.contactAddress ?? null,
        contactWebsite: data.contactWebsite ?? null,
        showPhone:   data.showPhone   ?? false,
        showAddress: data.showAddress ?? false,
        showWebsite: data.showWebsite ?? false,
      })
      .returning();

    // Sync contact info back to user profile as defaults for next submission
    const contactUpdate: Record<string, string | null> = {};
    if (data.contactPhone   !== undefined) contactUpdate.defaultPhone   = data.contactPhone   || null;
    if (data.contactAddress !== undefined) contactUpdate.defaultAddress = data.contactAddress || null;
    if (data.contactWebsite !== undefined) contactUpdate.defaultWebsite = data.contactWebsite || null;
    if (Object.keys(contactUpdate).length > 0) {
      await db.update(users).set(contactUpdate).where(eq(users.id, userId)).catch(console.error);
    }

    // Notify dashboard so admin sees new submission instantly (when socket is up)
    if (!data.isTest) pushDashboardUpdate({ adId: ad.id, status: "pending", locationSlug: location.slug }).catch(console.error);

    return NextResponse.json({ success: true, data: ad }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[POST /api/ads]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
