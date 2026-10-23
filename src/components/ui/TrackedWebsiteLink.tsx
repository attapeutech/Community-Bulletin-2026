"use client";

export function TrackedWebsiteLink({ adId, url }: { adId: string; url: string }) {
  const href = url.startsWith("http") ? url : `https://${url}`;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Fire tracking without blocking navigation
    fetch(`/api/ads/${adId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "website_click" }),
    }).catch(() => {});
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#4A90C4", textDecoration: "underline" }}
    >
      {url} ↗
    </a>
  );
}
