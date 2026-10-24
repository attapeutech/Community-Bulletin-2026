/**
 * Where to send someone after login / sign-up / email confirmation.
 * Only same-site paths are allowed ("/ads/new?location=x"), never "//evil.com" or "https://…".
 */
export function safeNext(raw: string | null | undefined, fallback = "/dashboard") {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

/** "/register?callbackUrl=…" style link that carries the destination along. */
export function withNext(path: string, next: string) {
  return next === "/dashboard" ? path : `${path}?callbackUrl=${encodeURIComponent(next)}`;
}
