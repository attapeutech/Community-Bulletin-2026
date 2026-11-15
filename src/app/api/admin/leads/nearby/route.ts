import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { cities, leadNotes, leads, locations, postalCodes, states } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { findNearby, PlacesError, placesConfigured } from "@/lib/nearby-places";

export const dynamic = "force-dynamic";

async function storeWithAddress(id: string) {
  const [s] = await db
    .select({
      id: locations.id, storeName: locations.storeName, addressLine1: locations.addressLine1,
      city: cities.name, state: states.code, zip: postalCodes.code,
    })
    .from(locations)
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .leftJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(eq(locations.id, id))
    .limit(1);
  return s ?? null;
}

// GET /api/admin/leads/nearby?store=<location id> — admin: businesses within a mile of the store
// (Google Places), each marked when it's already an advertiser lead
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    if (!placesConfigured()) {
      return NextResponse.json({ success: false, error: "Google Places isn't set up yet: add GOOGLE_PLACES_API_KEY on the server." }, { status: 503 });
    }
    const storeId = req.nextUrl.searchParams.get("store") ?? "";
    if (!z.string().uuid().safeParse(storeId).success) return NextResponse.json({ success: false, error: "Choose a store" }, { status: 400 });
    const store = await storeWithAddress(storeId);
    if (!store) return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });

    const address = [store.addressLine1, store.city, `${store.state} ${store.zip ?? ""}`.trim()].join(", ");
    const found = await findNearby(address, 1);

    // Already in the pipeline: same Google place, or same business name (any advertiser lead)
    const ids = found.map((f) => f.placeId);
    const names = found.map((f) => f.name.toLowerCase());
    const existing = found.length ? await db
      .select({ id: leads.id, placeId: leads.placeId, name: sql<string>`lower(${leads.businessName})` })
      .from(leads)
      .where(and(eq(leads.kind, "advertiser"), sql`(${inArray(leads.placeId, ids)} or lower(${leads.businessName}) in (${sql.join(names.map((n) => sql`${n}`), sql`, `)}))`)) : [];
    const results = found.map((f) => {
      const hit = existing.find((e) => e.placeId === f.placeId || e.name === f.name.toLowerCase());
      return { ...f, leadId: hit?.id ?? null };
    });

    return NextResponse.json({ success: true, data: { store: { id: store.id, name: store.storeName, address }, results } });
  } catch (error: any) {
    if (error instanceof PlacesError) return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    console.error("[GET /api/admin/leads/nearby]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const importSchema = z.object({
  storeId: z.string().uuid(),
  businesses: z.array(z.object({
    placeId: z.string().min(1).max(300),
    name: z.string().trim().min(1).max(200),
    category: z.string().max(100).nullable(),
    address: z.string().max(300).nullable(),
    phone: z.string().max(40).nullable(),
    website: z.string().max(500).nullable(),
    distanceMi: z.number().min(0).max(50),
  })).min(1).max(100),
});

// POST /api/admin/leads/nearby { storeId, businesses } — admin: add the ticked businesses as advertiser
// leads for that store (source "nearby"); skips any already in the pipeline
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const adminId = (session.user as any).id as string;
    const parsed = importSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Nothing to add" }, { status: 422 });
    const { storeId, businesses } = parsed.data;
    const store = await storeWithAddress(storeId);
    if (!store) return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });

    const dupes = await db
      .select({ placeId: leads.placeId, name: sql<string>`lower(${leads.businessName})` })
      .from(leads)
      .where(and(eq(leads.kind, "advertiser"), sql`(${inArray(leads.placeId, businesses.map((b) => b.placeId))} or lower(${leads.businessName}) in (${sql.join(businesses.map((b) => sql`${b.name.toLowerCase()}`), sql`, `)}))`));
    const fresh = businesses.filter((b) => !dupes.some((d) => d.placeId === b.placeId || d.name === b.name.toLowerCase()));
    if (!fresh.length) return NextResponse.json({ success: true, data: { added: 0, skipped: businesses.length } });

    const added = await db.insert(leads).values(fresh.map((b) => ({
      kind: "advertiser",
      businessName: b.name,
      phone: b.phone,
      address: b.address,
      city: store.city,
      website: b.website,
      category: b.category,
      placeId: b.placeId,
      source: "nearby",
      locationId: storeId,
      ownerId: adminId,
    }))).returning({ id: leads.id, name: leads.businessName });
    await db.insert(leadNotes).values(added.map((l) => {
      const b = fresh.find((f) => f.name === l.name)!;
      return { leadId: l.id, authorId: adminId, body: `Added by the nearby finder: ${b.category ?? "business"}, ${b.distanceMi} mi from ${store.storeName}` };
    }));
    return NextResponse.json({ success: true, data: { added: added.length, skipped: businesses.length - added.length } });
  } catch (error) {
    console.error("[POST /api/admin/leads/nearby]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
