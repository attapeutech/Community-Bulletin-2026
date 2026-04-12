import { requireAdmin } from "@/lib/auth/session";

export default async function AdminDashboard() {
  await requireAdmin();

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#1A3A5C", marginBottom: 6 }}>
        Admin Panel
      </h1>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
        Manage all ads, users, and platform settings.
      </p>
      <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D8E4EE", padding: 48, textAlign: "center" }}>
        <p style={{ color: "#6B8FA8", fontSize: 14 }}>Full admin dashboard coming in Phase 4.</p>
      </div>
    </div>
  );
}
