"use client";

type Props = {
  imageUrl: string;
  title: string;
  description: string | null;
  adId: string;
  locationSlug: string;
  contactPhone:   string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  showPhone:   boolean;
  showAddress: boolean;
  showWebsite: boolean;
};

export default function PublicAdPreview({
  imageUrl, title, description, adId,
  contactPhone, contactAddress, contactWebsite,
  showPhone, showAddress, showWebsite,
}: Props) {
  const hasSplit = !!(contactPhone || contactAddress || contactWebsite);

  const len = title.length;
  const titleSizeSm = len <= 20 ? "clamp(18px, 2.5vw, 34px)" : len <= 40 ? "clamp(14px, 1.8vw, 24px)" : "clamp(12px, 1.4vw, 18px)";

  return (
    <>
      {/* Thumbnail */}
      <div style={{ background: "#0A1A2E", borderRadius: 12, overflow: "hidden", marginBottom: 24, position: "relative" }}>
        {hasSplit ? (
          <div style={{ display: "flex", height: 340 }}>
            {/* Left panel */}
            <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(16px, 3vw, 40px)", position: "relative", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.15)" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: titleSizeSm, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 10 }}>{title}</div>
              {description && <div style={{ fontSize: "clamp(11px, 1.1vw, 14px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 12 }}>{description}</div>}
              {(showPhone || showAddress || showWebsite) && (
                <>
                  <div style={{ width: 28, height: 2, background: "#E8563A", borderRadius: 1, marginBottom: 8 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 }}>Contact Info</div>
                </>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {showPhone && contactPhone && (
                  <a href={`tel:${contactPhone}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#fff", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    📞 {contactPhone}
                  </a>
                )}
                {showAddress && contactAddress && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(contactAddress)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#fff", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    📍 {contactAddress}
                  </a>
                )}
                {showWebsite && contactWebsite && (
                  <a
                    href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#4A90C4", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    🌐 {contactWebsite}
                  </a>
                )}
              </div>
            </div>
            {/* Right image */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <img src={imageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>
        ) : (
          <>
            <img src={imageUrl} alt={title} style={{ width: "100%", maxHeight: 380, objectFit: "contain", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.7) 0%, transparent 30%)", pointerEvents: "none" }} />
          </>
        )}

        {/* Ad # */}
        <div style={{ position: "absolute", bottom: 10, right: 16, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          Ad #{adId.slice(-6).toUpperCase()}
        </div>
      </div>
    </>
  );
}
