"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useSavedAds, setSaved } from "@/lib/use-saved-ads";

/**
 * Save-to-wishlist heart. Signed-out visitors are sent to log in and brought back to this page.
 * variant "overlay": round button over an ad image · "pill": labelled button ("Save" / "Saved")
 */
export function HeartButton({ adId, variant = "overlay", refreshOnChange = false }: {
  adId: string;
  variant?: "overlay" | "pill";
  refreshOnChange?: boolean;  // re-render the page after a change (e.g. the Saved list)
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const signedIn = !!session?.user;
  const saved = useSavedAds(signedIn).has(adId);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // Hearts sit inside ad cards that are links — don't open the ad
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      const here = window.location.pathname + window.location.search;
      router.push(`/login?callbackUrl=${encodeURIComponent(here)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    const ok = await setSaved(adId, !saved);
    setBusy(false);
    if (ok && refreshOnChange) router.refresh();
  }

  const label = saved ? "Remove from saved ads" : "Save this ad";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
          border: `1px solid ${saved ? "#F4B4A6" : "#D8E4EE"}`, background: saved ? "#FFF1EE" : "#fff",
          color: saved ? "#C2410C" : "#1A3A5C", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        <Heart size={15} fill={saved ? "#E8563A" : "none"} color={saved ? "#E8563A" : "currentColor"} strokeWidth={2} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      style={{
        width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: saved ? "#fff" : "rgba(10,26,46,0.6)", backdropFilter: "blur(4px)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)", transition: "transform 0.15s ease",
      }}
      onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      <Heart size={17} fill={saved ? "#E8563A" : "none"} color={saved ? "#E8563A" : "#fff"} strokeWidth={2.2} />
    </button>
  );
}
