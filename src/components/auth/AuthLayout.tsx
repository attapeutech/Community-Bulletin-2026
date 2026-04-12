import { Icon } from "@/components/layout/Icon";
import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',Arial,sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: "42%", minWidth: 340, background: "#1A3A5C",
        padding: "32px 36px", display: "flex", flexDirection: "column",
        justifyContent: "space-between", alignItems: "center",
      }}>
        {/* Logo hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1, justifyContent: "center" }}>
          <div style={{ background: "#E8EFF6", borderRadius: 22, padding: 16, display: "flex", width: 112, height: 112, alignItems: "center", justifyContent: "center" }}>
            <Icon size={80} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 38, color: "#fff", lineHeight: 1.05 }}>Community</div>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 38, color: "#E8563A", lineHeight: 1.05 }}>
              Bulletin<span style={{ color: "#4A90C4", fontSize: 22, fontFamily: "Arial,sans-serif", fontWeight: 400 }}>.com</span>
            </div>
            <div style={{ width: 50, height: 3, background: "#E8563A", borderRadius: 2, margin: "12px auto 0" }} />
            <div style={{ fontSize: 11, color: "#9DC4E0", marginTop: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Digital in-store advertising
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ textAlign: "center", paddingBottom: 20 }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 17, color: "#fff", lineHeight: 1.4, marginBottom: 8 }}>
            Your neighborhood.<br />Your screen. Your community.
          </h2>
          <p style={{ fontSize: 12, color: "#9DC4E0", lineHeight: 1.65, margin: 0 }}>
            Connecting local businesses with their community —<br />
            on digital screens inside the stores people visit every day.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "space-around", width: "100%", paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[{ num: "500+", lbl: "Locations" }, { num: "2,400+", lbl: "Active ads" }, { num: "48", lbl: "States" }].map(({ num, lbl }) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 18, color: "#E8563A" }}>{num}</div>
              <div style={{ fontSize: 10, color: "#9DC4E0", marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, background: "#F4F7FB", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 16, padding: "36px 32px", border: "0.5px solid #D8E4EE" }}>
          {children}
        </div>
      </div>

    </div>
  );
}
