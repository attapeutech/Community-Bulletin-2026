"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Link2, Mail } from "lucide-react";
import { toast } from "sonner";

/**
 * Share an ad's public page. Uses the device's share sheet where available (phones, Safari, Edge);
 * otherwise a small menu: copy link, Facebook, X, WhatsApp, email.
 */
export function ShareButton({ adId, title, text }: { adId: string; title: string; text?: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const url = () => `${window.location.origin}/ad/${adId}`;
  const message = text ? `${title} — ${text}` : title;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: message, url: url() });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return; // user closed the share sheet
      }
    }
    setOpen(o => !o);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url());
      toast.success("Link copied", { description: "Paste it anywhere to share this ad." });
    } catch {
      toast.error("Couldn't copy the link", { description: url() });
    }
    setOpen(false);
  }

  const openWindow = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=560");
    setOpen(false);
  };

  const item: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px",
    background: "none", border: "none", textAlign: "left", fontSize: 13, color: "#1A3A5C", cursor: "pointer",
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={share}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
          border: "1px solid #D8E4EE", background: "#fff", color: "#1A3A5C",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        <Share2 size={15} strokeWidth={2} />
        Share
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, minWidth: 190,
            background: "#fff", border: "1px solid #D8E4EE", borderRadius: 10, padding: "4px 0",
            boxShadow: "0 10px 30px rgba(10,26,46,0.15)",
          }}
        >
          <button role="menuitem" style={item} onClick={copyLink}>
            <Link2 size={15} /> Copy link
          </button>
          <button role="menuitem" style={item} onClick={() => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>
            <span style={{ width: 15, textAlign: "center", fontWeight: 800, color: "#1877F2" }}>f</span> Facebook
          </button>
          <button role="menuitem" style={item} onClick={() => openWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url())}`)}>
            <span style={{ width: 15, textAlign: "center", fontWeight: 800 }}>𝕏</span> X (Twitter)
          </button>
          <button role="menuitem" style={item} onClick={() => openWindow(`https://wa.me/?text=${encodeURIComponent(`${message} ${url()}`)}`)}>
            <span style={{ width: 15, textAlign: "center", fontWeight: 800, color: "#25D366" }}>✆</span> WhatsApp
          </button>
          <button role="menuitem" style={item} onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${message}\n\n${url()}`)}`; setOpen(false); }}>
            <Mail size={15} /> Email
          </button>
        </div>
      )}
    </div>
  );
}
