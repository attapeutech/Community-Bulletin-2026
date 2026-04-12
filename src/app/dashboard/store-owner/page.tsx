import { requireStoreOwner } from "@/lib/auth/session";

export default async function StoreOwnerDashboard() {
  await requireStoreOwner();

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#1A3A5C", marginBottom: 6 }}>
        My Locations
      </h1>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
        Manage your store locations and active displays.
      </p>
      <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D8E4EE", padding: 48, textAlign: "center" }}>
        <p style={{ color: "#6B8FA8", fontSize: 14 }}>Store owner dashboard coming in Phase 4.</p>
      </div>
    </div>
  );
}
