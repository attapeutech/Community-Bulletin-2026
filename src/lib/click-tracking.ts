import type { NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// "Website visits" = QR scans (/go/[id]) + clicks on an ad's website link (public ad page).
// One visit per person (network address) per ad per minute; bots and link previews don't count.

const REPEAT_WINDOW_MS = 60_000;

// Shared across routes in this process (QR scan then link tap within a minute = one visit)
const recent: Map<string, number> =
  ((globalThis as any).__websiteVisitDedupe ??= new Map<string, number>());

// Crawlers and link-preview fetchers (iMessage, WhatsApp, Slack, Facebook, etc.)
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|slack|skype|embedly|quora|pinterest|vkshare|w3c_validator|curl|wget|python-requests|httpclient|headless/i;

// Anything with request headers: a route's NextRequest, or a page's headers()
type WithHeaders = { headers: Headers };

export function clientIp(req: WithHeaders | NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function isBot(req: WithHeaders | NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  return !ua || BOT_RE.test(ua);
}

/** Adds one website visit unless it's a bot or a repeat within a minute. Returns whether it counted. */
export async function recordWebsiteVisit(req: NextRequest, adId: string) {
  if (isBot(req)) return false;

  const key = `${clientIp(req)}:${adId}`;
  const now = Date.now();
  const last = recent.get(key);
  recent.set(key, now);
  if (recent.size > 10_000) {
    for (const [k, t] of recent) if (now - t > REPEAT_WINDOW_MS) recent.delete(k);
  }
  if (last !== undefined && now - last < REPEAT_WINDOW_MS) return false;

  await db
    .update(ads)
    .set({ websiteClickCount: sql`${ads.websiteClickCount} + 1` })
    .where(eq(ads.id, adId))
    .catch((err) => console.error("[click-tracking] increment failed", err));
  return true;
}

// QR code page counters (see the "QR code page" note in HANDOFF): one per person per ad per minute, per kind
const AD_EVENT_COLUMN = {
  scan: ads.qrScanCount,
  directions: ads.directionsClickCount,
  call: ads.callClickCount,
} as const;
export type AdEvent = keyof typeof AD_EVENT_COLUMN;

/** Adds one QR scan / directions tap / call tap unless it's a bot or a repeat within a minute. */
export async function recordAdEvent(req: WithHeaders | NextRequest, adId: string, kind: AdEvent) {
  if (isBot(req)) return false;
  const key = `${kind}:${clientIp(req)}:${adId}`;
  const now = Date.now();
  const last = recent.get(key);
  recent.set(key, now);
  if (last !== undefined && now - last < REPEAT_WINDOW_MS) return false;

  const col = AD_EVENT_COLUMN[kind];
  await db
    .update(ads)
    .set({ [kind === "scan" ? "qrScanCount" : kind === "directions" ? "directionsClickCount" : "callClickCount"]: sql`${col} + 1` })
    .where(eq(ads.id, adId))
    .catch((err) => console.error(`[click-tracking] ${kind} increment failed`, err));
  return true;
}
