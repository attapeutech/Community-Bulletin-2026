// Dashboard loading — mirrors DashboardLayout: navy sidebar + main content
export default function DashboardLoading() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F7FB" }}>

      {/* Sidebar — navy, 240px */}
      <aside style={{ width: 240, background: "#1A3A5C", flexShrink: 0, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingLeft: 8 }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div className="skeleton" style={{ width: 70, height: 12, background: "rgba(255,255,255,0.12)" }} />
            <div className="skeleton" style={{ width: 60, height: 12, background: "rgba(255,255,255,0.10)" }} />
          </div>
        </div>
        {/* Nav items */}
        {[100, 80, 110, 90, 95, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.10)" }} />
        ))}
        {/* Spacer + sign out */}
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: "100%", height: 36, borderRadius: 8, background: "rgba(255,255,255,0.08)" }} />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 24, overflow: "auto" }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: 200, height: 26 }} />
            <div className="skeleton" style={{ width: 300, height: 13 }} />
          </div>
          <div className="skeleton" style={{ width: 130, height: 38, borderRadius: 8 }} />
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="skeleton" style={{ width: "50%", height: 11 }} />
              <div className="skeleton" style={{ width: "65%", height: 28 }} />
            </div>
          ))}
        </div>

        {/* Table / card list */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D8E4EE", overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #EDF2F7", display: "flex", gap: 16 }}>
            {[140, 100, 80, 80, 100].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: w, height: 12 }} />
            ))}
          </div>
          {/* Rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #F7FAFC", display: "flex", gap: 16, alignItems: "center" }}>
              <div className="skeleton" style={{ width: 140, height: 14 }} />
              <div className="skeleton" style={{ width: 100, height: 22, borderRadius: 20 }} />
              <div className="skeleton" style={{ width: 80,  height: 12 }} />
              <div className="skeleton" style={{ width: 80,  height: 12 }} />
              <div className="skeleton" style={{ width: 100, height: 28, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
