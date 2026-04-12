import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function UserDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = session.user as any;

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#1A3A5C", marginBottom: 6 }}>
        Welcome back, {user.name.split(" ")[0]}!
      </h1>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
        Manage your ads and track their performance.
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total ads", value: "0" },
          { label: "Active ads", value: "0" },
          { label: "Pending review", value: "0" },
          { label: "Total spent", value: "$0" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "0.5px solid #D8E4EE" }}>
            <div style={{ fontSize: 12, color: "#6B8FA8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1A3A5C", fontFamily: "Georgia,serif" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D8E4EE", padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: "#1A3A5C", marginBottom: 8 }}>No ads yet</h2>
        <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 24 }}>
          Post your first ad and reach customers at local store locations.
        </p>
        <a
          href="/ads/new"
          style={{
            display: "inline-block",
            background: "#1A3A5C",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Post your first ad
        </a>
      </div>
    </div>
  );
}
