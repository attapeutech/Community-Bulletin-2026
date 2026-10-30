"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Google Analytics 4 measurement ID (public, not a secret). Empty = analytics off.
const GA_ID = "G-TRMHS7J1CJ";

// Site visitors only: store TV screens run all day and would flood the numbers, and
// signed-in dashboards are staff and customers at work, not marketing traffic
const SKIP = ["/display", "/dashboard"];

export function GoogleAnalytics() {
  const pathname = usePathname();
  if (!GA_ID || SKIP.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
