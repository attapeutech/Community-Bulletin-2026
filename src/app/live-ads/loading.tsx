export default function LiveAdsLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB" }}>

      {/* Navbar skeleton */}
      <div style={{ background: "#fff", borderBottom: "1px solid #D8E4EE", height: 64, display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 120, height: 34, borderRadius: 8 }} />
        <div className="skeleton" style={{ flex: 1, maxWidth: 440, height: 34, borderRadius: 8 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: 100, height: 34, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 90,  height: 34, borderRadius: 8 }} />
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: 90, height: 11 }} />
            <div className="skeleton" style={{ width: 200, height: 34 }} />
          </div>
          <div className="skeleton" style={{ width: 100, height: 13 }} />
        </div>

        {/* Ad card skeletons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #D8E4EE", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <div className="skeleton" style={{ height: 16, width: "70%" }} />
                <div className="skeleton" style={{ height: 12, width: "90%" }} />
                <div className="skeleton" style={{ height: 12, width: "60%" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div className="skeleton" style={{ width: 16, height: 16, borderRadius: "50%" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: "55%" }} />
                    <div className="skeleton" style={{ height: 11, width: "35%" }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #EDF2F7", display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton" style={{ height: 12, width: "40%" }} />
                <div className="skeleton" style={{ height: 12, width: "12%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
