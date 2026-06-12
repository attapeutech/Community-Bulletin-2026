// Home page route-level loading
export default function HomeLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB" }}>
      {/* Navbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #D8E4EE", height: 64, display: "flex", alignItems: "center", padding: "0 24px", gap: 32 }}>
        <div className="skeleton" style={{ width: 144, height: 36, borderRadius: 10 }} />
        <div style={{ display: "flex", gap: 24, flex: 1 }}>
          {[80, 96, 64, 56, 72].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 13 }} />
          ))}
        </div>
        <div className="skeleton" style={{ width: 80,  height: 34, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 110, height: 34, borderRadius: 8 }} />
      </div>

      {/* Hero */}
      <div style={{ background: "#1A3A5C", padding: "80px 24px 72px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div className="skeleton" style={{ width: 96, height: 11, background: "rgba(255,255,255,0.12)" }} />
        <div className="skeleton" style={{ width: "min(560px, 80vw)", height: 48, background: "rgba(255,255,255,0.12)" }} />
        <div className="skeleton" style={{ width: "min(400px, 70vw)", height: 20, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <div className="skeleton" style={{ width: 140, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.12)" }} />
          <div className="skeleton" style={{ width: 120, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.08)" }} />
        </div>
      </div>

      {/* Features strip */}
      <div style={{ background: "#fff", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div className="skeleton" style={{ width: "70%", height: 15 }} />
              <div className="skeleton" style={{ width: "100%", height: 11 }} />
              <div className="skeleton" style={{ width: "80%", height: 11 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Cards section */}
      <div style={{ background: "#F4F7FB", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skeleton" style={{ width: 80, height: 11 }} />
              <div className="skeleton" style={{ width: 220, height: 30 }} />
            </div>
            <div className="skeleton" style={{ width: 110, height: 13 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #D8E4EE", overflow: "hidden" }}>
                <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="skeleton" style={{ height: 15, width: "65%" }} />
                  <div className="skeleton" style={{ height: 11, width: "90%" }} />
                  <div className="skeleton" style={{ height: 11, width: "55%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
