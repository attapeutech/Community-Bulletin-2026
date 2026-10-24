import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ads, locations, cities, states, savedAds } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { HeartButton } from "@/components/ui/HeartButton";

const ACCENT = "#1A3A5C";

export default async function SavedAdsPage() {
  const session = await requireAuth();
  const userId = (session.user as any).id as string;

  const rows = await db
    .select({
      id: ads.id,
      title: ads.title,
      description: ads.description,
      imageUrl: ads.imageUrl,
      status: ads.status,
      startedAt: ads.startedAt,
      endedAt: ads.endedAt,
      storeName: locations.storeName,
      displayName: locations.displayName,
      storeNumber: locations.storeNumber,
      cityName: cities.name,
      stateCode: states.code,
      savedAt: savedAds.createdAt,
    })
    .from(savedAds)
    .innerJoin(ads, eq(savedAds.adId, ads.id))
    .innerJoin(locations, eq(ads.locationId, locations.id))
    .innerJoin(cities, eq(locations.cityId, cities.id))
    .innerJoin(states, eq(locations.stateId, states.id))
    .where(eq(savedAds.userId, userId))
    .orderBy(desc(savedAds.createdAt));

  const now = new Date();
  const isLive = (r: typeof rows[number]) =>
    r.status === "approved" && !!r.startedAt && !!r.endedAt && r.startedAt <= now && r.endedAt >= now;

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>Saved Ads</h1>
      <p style={{ color: "#4A6B82", fontSize: 14, marginBottom: 24 }}>
        Ads you&apos;ve saved with the heart. Tap the heart again to remove one.
      </p>

      {rows.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤍</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, marginBottom: 8 }}>No saved ads yet</h2>
          <p style={{ color: "#4A6B82", fontSize: 14, marginBottom: 20 }}>Browse ads running in local stores and tap the heart to save the ones you like.</p>
          <Link href="/live-ads" style={{ background: ACCENT, color: "#fff", padding: "10px 22px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            Browse live ads
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {rows.map(r => {
            const live = isLive(r);
            const card = (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", opacity: live ? 1 : 0.75 }}>
                <div style={{ position: "relative", height: 150, background: "#0A1A2E" }}>
                  <img src={r.imageUrl} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: live ? undefined : "grayscale(0.6)" }} />
                  <span style={{
                    position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                    background: live ? "#16a34a" : "rgba(10,26,46,0.75)", color: "#fff",
                  }}>
                    {live ? "LIVE" : "Ended"}
                  </span>
                  <div style={{ position: "absolute", top: 8, right: 8 }}>
                    <HeartButton adId={r.id} refreshOnChange />
                  </div>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: ACCENT, lineHeight: 1.3 }}>{r.title}</div>
                  {r.description && (
                    <div style={{ fontSize: 12, color: "#4A6B82", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{r.description}</div>
                  )}
                  <div style={{ fontSize: 12, color: "#1A3A5C", fontWeight: 600, marginTop: "auto", paddingTop: 6 }}>
                    📍 {r.displayName || r.storeName}
                    {r.storeNumber && <span style={{ color: "#E8563A", marginLeft: 4 }}>#{r.storeNumber.replace(/^#/, "")}</span>}
                    <span style={{ color: "#4A6B82", fontWeight: 400 }}> · {r.cityName}, {r.stateCode}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#5B7D96" }}>
                    Saved {r.savedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                    {!live && " · no longer running"}
                  </div>
                </div>
              </div>
            );
            // Running ads open their public page; ended ones aren't publicly viewable
            return live ? (
              <Link key={r.id} href={`/ad/${r.id}`} style={{ textDecoration: "none" }}>{card}</Link>
            ) : (
              <div key={r.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
