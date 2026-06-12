// New ad / payment form loading
export default function AdsLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB" }}>
      {/* Navbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #D8E4EE", height: 64, display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
        <div className="skeleton" style={{ width: 144, height: 36, borderRadius: 10 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: 80,  height: 34, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 110, height: 34, borderRadius: 8 }} />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Heading */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ width: 220, height: 28 }} />
          <div className="skeleton" style={{ width: 340, height: 13 }} />
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ flex: 1, height: 6, borderRadius: 3 }} />
          ))}
        </div>

        {/* Form card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Image upload area */}
          <div className="skeleton" style={{ width: "100%", height: 160, borderRadius: 12 }} />

          {/* Fields */}
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ width: 100, height: 12 }} />
              <div className="skeleton" style={{ width: "100%", height: 40, borderRadius: 8 }} />
            </div>
          ))}

          {/* Two-col row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ width: 90, height: 12 }} />
                <div className="skeleton" style={{ width: "100%", height: 40, borderRadius: 8 }} />
              </div>
            ))}
          </div>

          {/* Button row */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <div className="skeleton" style={{ width: 90,  height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 130, height: 40, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
