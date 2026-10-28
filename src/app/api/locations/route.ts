import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { locations, countries, states, cities, postalCodes, users, partnerApplications, leads, leadNotes } from "@/lib/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { MIN_PRICE_PER_RUN_CENTS, MAX_PRICE_PER_RUN_CENTS, MAX_SHARE_RATE_BPS, AD_PRICE_CENTS, DEFAULT_SHARE_RATE_BPS } from "@/types";
import slugify from "slugify";
import { nanoid } from "nanoid";

// ─── GET /api/locations ───────────────────────────────────────────────────────
// Public search (for ad submission location picker).
// If ?mine=true + authenticated store_owner/admin → returns own / all locations.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const countryId = searchParams.get("countryId");
  const stateId = searchParams.get("stateId");
  const cityId = searchParams.get("cityId");
  const search = searchParams.get("search");
  const slug = searchParams.get("slug");  // exact store, e.g. from a display-screen QR code

  try {
    const conditions: ReturnType<typeof eq>[] = [eq(locations.isActive, true)];

    if (mine) {
      const session = await getSession();
      if (session) {
        const role = (session.user as any).role as string;
        const userId = (session.user as any).id as string;
        // Admin sees all; store_owner sees own
        if (role === "store_owner") conditions.push(eq(locations.storeOwnerId, userId));
        // admin: no owner filter → sees all
      }
    }

    if (countryId) conditions.push(eq(locations.countryId, countryId));
    if (stateId) conditions.push(eq(locations.stateId, stateId));
    if (cityId) conditions.push(eq(locations.cityId, cityId));
    if (slug) conditions.push(eq(locations.slug, slug));
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(locations.storeName, term),
          ilike(locations.storeNumber, term),
          ilike(locations.addressLine1, term),
          ilike(cities.name, term),
          ilike(states.name, term),
          ilike(states.code, term),
          ilike(postalCodes.code, term),
        ) as ReturnType<typeof eq>
      );
    }

    const results = await db
      .select({
        id: locations.id,
        storeName: locations.storeName,
        storeNumber: locations.storeNumber,
        pricePerRunCents: locations.pricePerRunCents,
        dailyCustomers: locations.dailyCustomers,
        addressLine1: locations.addressLine1,
        addressLine2: locations.addressLine2,
        slug: locations.slug,
        displayName: locations.displayName,
        currency: locations.currency,
        isActive: locations.isActive,
        createdAt: locations.createdAt,
        storeOwner: { id: users.id, name: users.name, email: users.email },
        country: { id: countries.id, name: countries.name, code: countries.code },
        state: { id: states.id, name: states.name, code: states.code },
        city: { id: cities.id, name: cities.name },
        postalCode: { id: postalCodes.id, code: postalCodes.code },
      })
      .from(locations)
      .innerJoin(users, eq(locations.storeOwnerId, users.id))
      .innerJoin(countries, eq(locations.countryId, countries.id))
      .innerJoin(states, eq(locations.stateId, states.id))
      .innerJoin(cities, eq(locations.cityId, cities.id))
      .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
      .where(and(...conditions))
      .limit(100);

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error("[GET /api/locations]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST /api/locations ──────────────────────────────────────────────────────
const createSchema = z.object({
  storeName: z.string().min(2).max(120),
  storeNumber: z.string().max(50).optional(),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(100).optional(),
  displayName: z.string().max(120).optional(),
  countryId: z.string().uuid(),
  stateId: z.string().uuid(),
  cityId: z.string().uuid(),
  postalCodeId: z.string().uuid(),
  currency: z.string().length(3).default("USD"),
  // Admin-only fields (defaults applied for store owners below)
  pricePerRunCents: z.number().int().min(MIN_PRICE_PER_RUN_CENTS).max(MAX_PRICE_PER_RUN_CENTS).default(AD_PRICE_CENTS),
  shareRateBps: z.number().int().min(0).max(MAX_SHARE_RATE_BPS).default(DEFAULT_SHARE_RATE_BPS),
  equipmentProvided: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  logoUrl: z.string().url().optional(),
  businessHours: z.string().max(500).optional(),
  // Admin-only: set up the first store for an approved partner application (owned by the applicant)
  applicationId: z.string().uuid().optional(),
  // Admin-only: set up the store for a sales lead (owned by the lead's linked account, if any)
  leadId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role as string;
    if (role !== "store_owner" && role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createSchema.parse(body);
    const userId = (session.user as any).id as string;
    const isAdmin = role === "admin";

    let ownerId = userId;
    let leadStage: string | null = null;
    if (data.applicationId) {
      if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      const [app] = await db
        .select({ userId: partnerApplications.userId, status: partnerApplications.status })
        .from(partnerApplications)
        .where(eq(partnerApplications.id, data.applicationId))
        .limit(1);
      if (!app || app.status !== "approved") {
        return NextResponse.json({ success: false, error: "Approve the application first" }, { status: 409 });
      }
      ownerId = app.userId;
    } else if (data.leadId) {
      if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      const [lead] = await db
        .select({ kind: leads.kind, stage: leads.stage, locationId: leads.locationId, ownerId: users.id, ownerRole: users.role, agreementStatus: users.partnerAgreementStatus })
        .from(leads)
        .leftJoin(users, eq(leads.userId, users.id))
        .where(eq(leads.id, data.leadId))
        .limit(1);
      if (!lead || lead.kind !== "store_partner") {
        return NextResponse.json({ success: false, error: "Store lead not found" }, { status: 404 });
      }
      if (lead.locationId) {
        return NextResponse.json({ success: false, error: "This lead already has a store location" }, { status: 409 });
      }
      leadStage = lead.stage;
      // The lead's linked account owns the store and earns the owner share; without one, the admin does
      if (lead.ownerId) {
        ownerId = lead.ownerId;
        if (lead.ownerRole === "user" || lead.agreementStatus === null) {
          await db.update(users)
            .set({
              // Same as approving an application: advertisers become store owners; approvers/admins keep their role
              ...(lead.ownerRole === "user" && { role: "store_owner" as const }),
              ...(lead.agreementStatus === null && { partnerAgreementStatus: "not_sent" }),
              updatedAt: new Date(),
            })
            .where(eq(users.id, lead.ownerId));
        }
      }
    }

    // Generate a unique slug from store name + short id
    const baseSlug = slugify(data.storeName, { lower: true, strict: true });
    const slug = `${baseSlug}-${nanoid(6)}`;

    const [location] = await db.insert(locations).values({
      storeOwnerId: ownerId,
      storeName: data.storeName,
      storeNumber: data.storeNumber ?? null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      displayName: data.displayName ?? null,
      countryId: data.countryId,
      stateId: data.stateId,
      cityId: data.cityId,
      postalCodeId: data.postalCodeId,
      currency: data.currency,
      slug,
      isActive: true,
      // Store owners always start on the standard price and share; an admin adjusts later
      pricePerRunCents: isAdmin ? data.pricePerRunCents : AD_PRICE_CENTS,
      shareRateBps: isAdmin ? data.shareRateBps : DEFAULT_SHARE_RATE_BPS,
      equipmentProvided: isAdmin ? data.equipmentProvided : false,
      description: data.description ?? null,
      category: data.category ?? null,
      logoUrl: data.logoUrl ?? null,
      businessHours: data.businessHours ?? null,
    }).returning();

    if (data.applicationId) {
      await db.update(partnerApplications)
        .set({ locationId: location.id, updatedAt: new Date() })
        .where(eq(partnerApplications.id, data.applicationId));
    }
    if (data.leadId) {
      // The store is set up, so the deal is won
      const now = new Date();
      const won = leadStage !== "won";
      await db.update(leads)
        .set({ locationId: location.id, ...(won && { stage: "won" as const, wonAt: now, nextFollowUp: null, lostReason: null }), updatedAt: now })
        .where(eq(leads.id, data.leadId));
      await db.insert(leadNotes).values({
        leadId: data.leadId,
        authorId: userId,
        body: `Store set up: ${location.storeName}${won ? " (marked Won)" : ""}`,
      });
    }

    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 422 });
    }
    console.error("[POST /api/locations]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
