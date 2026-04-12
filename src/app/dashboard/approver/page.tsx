import { requireApproverOrAdmin } from "@/lib/auth/session";

export default async function ApproverDashboard() {
  await requireApproverOrAdmin();

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#1A3A5C", marginBottom: 6 }}>
        Review Ads
      </h1>
      <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
        Review and approve or deny submitted ads.
      </p>
      <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D8E4EE", padding: 48, textAlign: "center" }}>
        <p style={{ color: "#6B8FA8", fontSize: 14 }}>Approver dashboard coming in Phase 4.</p>
      </div>
    </div>
  );
}
