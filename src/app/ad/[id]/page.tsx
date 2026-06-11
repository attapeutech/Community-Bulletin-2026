import { db } from "@/lib/db/client";
import { ads, locations, cities, states, postalCodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicAdPreview from "./PublicAdPreview";

export default async function PublicAdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({
      id: ads.id,
      title: ads.title,
      description: ads.description,
      imageUrl: ads.imageUrl,
      status: ads.status,
      startedAt: ads.startedAt,
      endedAt: ads.endedAt,
      contactPhone:   ads.contactPhone,
      contactAddress: ads.contactAddress,
      contactWebsite: ads.contactWebsite,
      showPhone:   ads.showPhone,
      showAddress: ads.showAddress,
      showWebsite: ads.showWebsite,
      locationSlug: locations.slug,
      locationName: locations.displayName,
      storeName:    locations.storeName,
      storeNumber:  locations.storeNumber,
      addressLine1: locations.addressLine1,
      addressLine2: locations.addressLine2,
      cityName:     cities.name,
      stateCode:    states.code,
      postalCode:   postalCodes.code,
    })
    .from(ads)
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .innerJoin(postalCodes, eq(locations.postalCodeId, postalCodes.id))
    .where(and(eq(ads.id, id), eq(ads.status, "approved"), eq(ads.paymentStatus, "paid")))
    .limit(1);

  if (!row) notFound();

  const displayName = row.locationName || row.storeName;
  const fullAddress = `${row.addressLine1}${row.addressLine2 ? `, ${row.addressLine2}` : ""}, ${row.cityName}, ${row.stateCode} ${row.postalCode}`;

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB", padding: "32px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Back */}
        <Link href="/#live-ads" style={{ fontSize: 13, color: "#6B8FA8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
          ← Back to live ads
        </Link>

        {/* Title row */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(22px,4vw,32px)", fontWeight: 700, color: "#1A3A5C", marginBottom: 8 }}>
            {row.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
              <span style={{ width: 6, height: 6, background: "#16a34a", borderRadius: "50%", display: "inline-block" }} />
              Live Now
            </span>
            <span style={{ fontSize: 12, color: "#6B8FA8" }}>
              through {fmt(row.endedAt)}
            </span>
          </div>
        </div>

        {/* Image preview (client — handles fullscreen modal) */}
        <PublicAdPreview
          imageUrl={row.imageUrl}
          title={row.title}
          description={row.description}
          adId={row.id}
          locationSlug={row.locationSlug}
          contactPhone={row.contactPhone}
          contactAddress={row.contactAddress}
          contactWebsite={row.contactWebsite}
          showPhone={row.showPhone}
          showAddress={row.showAddress}
          showWebsite={row.showWebsite}
        />

        {/* Details card */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #D8E4EE", padding: "0 24px", marginBottom: 24 }}>
          <Row label="Location">
            <span style={{ fontWeight: 600, color: "#1A3A5C" }}>
              {displayName}
              {row.storeNumber && <span style={{ color: "#E8563A", marginLeft: 4 }}>#{row.storeNumber}</span>}
            </span>
            <br />
            <span style={{ fontSize: 12, color: "#6B8FA8" }}>{fullAddress}</span>
          </Row>

          {row.description && (
            <Row label="Description">
              <span style={{ color: "#1A3A5C" }}>{row.description}</span>
            </Row>
          )}

          {(row.showPhone || row.showAddress || row.showWebsite) && (
            <Row label="Contact Info">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {row.showPhone && row.contactPhone && (
                  <a href={`tel:${row.contactPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1A3A5C", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                    📞 {row.contactPhone}
                  </a>
                )}
                {row.showAddress && row.contactAddress && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(row.contactAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1A3A5C", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
                  >
                    📍 {row.contactAddress}
                  </a>
                )}
                {row.showWebsite && row.contactWebsite && (
                  <a
                    href={row.contactWebsite.startsWith("http") ? row.contactWebsite : `https://${row.contactWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#4A90C4", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
                  >
                    🌐 {row.contactWebsite}
                  </a>
                )}
              </div>
            </Row>
          )}

          <Row label="Run dates">
            <span style={{ color: "#1A3A5C" }}>{fmt(row.startedAt)} – {fmt(row.endedAt)}</span>
          </Row>

          <Row label="Ad ID" last>
            <span style={{ fontSize: 13, color: "#6B8FA8", fontFamily: "monospace" }}>#{row.id.slice(-6).toUpperCase()}</span>
          </Row>
        </div>

        {/* View live display CTA */}
        <Link
          href={`/display/${row.locationSlug}`}
          target="_blank"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#1A3A5C", color: "#fff",
            padding: "12px 24px", borderRadius: 10,
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}
        >
          <span>📺</span> View Live Display ↗
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: "flex", gap: 16, padding: "14px 0",
      borderBottom: last ? "none" : "1px solid #D8E4EE",
      fontSize: 14,
    }}>
      <div style={{ width: 140, flexShrink: 0, color: "#6B8FA8", fontSize: 13 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
