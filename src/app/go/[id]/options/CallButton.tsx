"use client";

// "Call" on the QR page: a normal tel: link, with the tap reported in the background so it counts
export default function CallButton({ adId, phone, className }: { adId: string; phone: string; className: string }) {
  const tel = phone.replace(/[^\d+]/g, "");
  function report() {
    const body = JSON.stringify({ event: "call" });
    try {
      if (!navigator.sendBeacon?.(`/api/ads/${adId}/track`, new Blob([body], { type: "application/json" }))) {
        fetch(`/api/ads/${adId}/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    } catch { /* counting must never block the call */ }
  }
  return (
    <a href={`tel:${tel}`} onClick={report} className={className}>
      <span aria-hidden="true">📞</span> Call {phone}
    </a>
  );
}
