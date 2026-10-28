"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Live Ads shows /display/all inside a frame. If anything else on the site ends up loaded in
 * that frame (a tapped link), move it to the whole tab: Stripe checkout and sign-in refuse to
 * run inside a frame, and the address bar should show the real page.
 */
export function LeaveFrame() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.top === window.self || pathname?.startsWith("/display")) return;
    try {
      window.top!.location.href = window.location.href;
    } catch {
      /* framed by another site: nothing we can do from here */
    }
  }, [pathname]);
  return null;
}
