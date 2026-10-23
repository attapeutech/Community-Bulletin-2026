// Auth pages loading — mirrors AuthLayout: navy left panel + right form card
export default function AuthLoading() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left panel — navy */}
      <div style={{ width: "42%", minWidth: 340, background: "#1A3A5C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "40px 36px" }}>
        <div className="skeleton" style={{ width: 96, height: 96, borderRadius: 22, background: "rgba(255,255,255,0.12)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div className="skeleton" style={{ width: 180, height: 32, background: "rgba(255,255,255,0.12)" }} />
          <div className="skeleton" style={{ width: 220, height: 32, background: "rgba(255,255,255,0.10)" }} />
          <div className="skeleton" style={{ width: 48, height: 3,  background: "rgba(255,255,255,0.15)", marginTop: 4 }} />
        </div>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div className="skeleton" style={{ width: 220, height: 13, background: "rgba(255,255,255,0.08)" }} />
          <div className="skeleton" style={{ width: 180, height: 13, background: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, background: "#F4F7FB", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: "36px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Heading */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: "55%", height: 24 }} />
            <div className="skeleton" style={{ width: "80%", height: 13 }} />
          </div>
          {/* Fields */}
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ width: 80, height: 12 }} />
              <div className="skeleton" style={{ width: "100%", height: 40, borderRadius: 8 }} />
            </div>
          ))}
          {/* Button */}
          <div className="skeleton" style={{ width: "100%", height: 42, borderRadius: 8, marginTop: 4 }} />
          {/* Divider + social */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="skeleton" style={{ flex: 1, height: 1 }} />
            <div className="skeleton" style={{ width: 28, height: 13 }} />
            <div className="skeleton" style={{ flex: 1, height: 1 }} />
          </div>
          <div className="skeleton" style={{ width: "100%", height: 40, borderRadius: 8 }} />
          {/* Footer link */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="skeleton" style={{ width: 160, height: 12 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
