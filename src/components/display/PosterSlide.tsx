import { QRCodeSVG } from "qrcode.react";

/**
 * "Upload your own design" ads (template "poster"): the advertiser's flyer or poster fills the screen,
 * with no title or contact panel beside it. A portrait flyer on a landscape TV gets a soft, darkened
 * copy of itself behind it instead of black bars. If a website was given, a "Scan to visit" QR code
 * sits in the bottom-right corner (on store screens it goes through /go/<id> so scans count).
 */
export function PosterSlide({
  imageUrl, title, qrValue, compact = false, zooming = false,
}: {
  imageUrl: string | null;
  title: string;
  qrValue: string | null;
  compact?: boolean;   // small previews in the ad form
  zooming?: boolean;   // the slide on screen: slow, gentle zoom
}) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0A1A2E" }}>
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              filter: "blur(28px) brightness(0.4) saturate(1.2)", transform: "scale(1.2)",
            }}
          />
          <img
            src={imageUrl}
            alt={title}
            className={zooming ? "cb-kenburns-soft" : undefined}
            style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        </>
      )}
      {qrValue && (
        <div
          style={{
            position: "absolute",
            right: compact ? 8 : "clamp(12px, 1.6vw, 32px)",
            bottom: compact ? 8 : "clamp(12px, 1.6vw, 32px)",
            background: "#fff",
            borderRadius: compact ? 6 : "clamp(8px, 0.8vw, 14px)",
            padding: compact ? 4 : "clamp(6px, 0.6vw, 12px)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
            textAlign: "center",
            width: compact ? 58 : "clamp(96px, 9vw, 180px)",
          }}
        >
          <QRCodeSVG value={qrValue} size={256} level="M" marginSize={0} fgColor="#0A1A2E" bgColor="#FFFFFF" style={{ width: "100%", height: "auto", display: "block" }} />
          <div style={{ fontSize: compact ? 7 : "clamp(10px, 0.85vw, 16px)", fontWeight: 700, color: "#0A1A2E", marginTop: compact ? 2 : 6, lineHeight: 1.1 }}>
            Scan to visit
          </div>
        </div>
      )}
    </div>
  );
}
