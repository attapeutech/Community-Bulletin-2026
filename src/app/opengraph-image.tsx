import { ImageResponse } from "next/og";

// Link preview image when the site is shared (ad pages use the ad's own photo instead)
export const alt = "Community Bulletin: local ads on screens inside neighborhood stores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1A3A5C 0%, #24507D 100%)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", width: 120, height: 10, background: "#E8563A", borderRadius: 5, marginBottom: 40 }} />
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -1 }}>
          Community<span style={{ color: "#E8563A" }}>Bulletin</span>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 24, color: "#DCE8F3", lineHeight: 1.3 }}>
          Local ads on screens inside neighborhood stores
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 48, color: "#9FC0DD" }}>
          communitybulletin.com
        </div>
      </div>
    ),
    size,
  );
}
