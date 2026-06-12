// Public ad detail page loading
export default function AdDetailLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB" }}>
      {/* Navbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #D8E4EE", height: 64, display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
        <div className="skeleton" style={{ width: 144, height: 36, borderRadius: 10 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: 80,  height: 34, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 110, height: 34, borderRadius: 8 }} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Back link */}
        <div className="skeleton" style={{ width: 120, height: 13 }} />

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", overflow: "hidden" }}>
          {/* Hero image */}
          <div className="skeleton" style={{ height: 340, borderRadius: 0 }} />

          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title + badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <div className="skeleton" style={{ width: "60%", height: 28 }} />
                <div className="skeleton" style={{ width: "85%", height: 13 }} />
                <div className="skeleton" style={{ width: "70%", height: 13 }} />
              </div>
              <div className="skeleton" style={{ width: 80, height: 26, borderRadius: 20, flexShrink: 0 }} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#EDF2F7" }} />

            {/* Location + contact */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton" style={{ width: 60, height: 11 }} />
                  <div className="skeleton" style={{ width: "75%", height: 15 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
