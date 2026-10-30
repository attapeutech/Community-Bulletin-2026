import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/two-factor",
  "/display",
  "/ad",
  "/live-ads",
  "/help",
  "/privacy",
  "/terms",
  "/contact",
  "/demo",        // franchise partner pitch page (linked from the public navbar)
  "/go",          // QR code short links from display screens
  "/stores",      // each store's public page (linked as "Public Page" from the store owner dashboard)
  "/robots.txt",  // SEO: search engines read these logged out
  "/sitemap.xml",
  "/opengraph-image",    // link preview image when the site is shared
  "/icon.png",           // site icons (logged-out visitors and store screens need these)
  "/apple-icon.png",
  "/display.webmanifest", // home-screen settings for display screens
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    // Stripe calls these directly; each checks Stripe's signature
    pathname === "/api/payments/stripe/webhook" ||
    pathname === "/api/payments/stripe/connect-webhook" ||
    pathname.startsWith("/api/display") ||
    pathname.startsWith("/api/ads/live") ||
    pathname === "/api/health" ||   // Coolify health check (zero-downtime deploys)
    pathname === "/api/partners/apply-signup" ||   // register form, before email confirmation
    /^\/api\/ads\/[^/]+\/track$/.test(pathname) ||   // view/click tracking from logged-out display screens
    pathname.startsWith("/api/geo") ||
    pathname.startsWith("/api/support") ||
    pathname.startsWith("/api/auth/verify-recaptcha") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    // Keep the query string so e.g. /ads/new?location=… survives the login / sign-up detour
    loginUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
