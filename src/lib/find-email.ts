// Server only. "Find email" for Sales leads: reads a business's public website (home page plus its
// contact / about page) and returns email addresses the business has published there.
// Safety: fetches only public http(s) sites; every address (including redirects) is resolved and
// refused if it points at a private / local network, so it can't be used to probe our own servers.
import { lookup } from "node:dns/promises";
import net from "node:net";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

function privateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

async function assertPublic(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http(s) websites");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("Unusual port");
  const host = url.hostname;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Not a public website");
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("Not a public website");
}

/** GET a public page as text (follows a few redirects, each checked; size and time limited) */
async function fetchPage(start: string): Promise<{ url: string; html: string } | null> {
  let url = new URL(start);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // Private / local / odd addresses: treated as "nothing found" (never fetched)
    try { await assertPublic(url); } catch { return null; }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CommunityBulletinBot/1.0)", Accept: "text/html,*/*;q=0.5" },
      });
      if (res.status >= 300 && res.status < 400) {
        const next = res.headers.get("location");
        if (!next) return null;
        url = new URL(next, url);
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
      const reader = res.body?.getReader();
      if (!reader) return null;
      let html = "", bytes = 0;
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        html += dec.decode(value, { stream: true });
        if (bytes > MAX_BYTES) { reader.cancel().catch(() => {}); break; }
      }
      return { url: url.toString(), html };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}/gi;
// Addresses that are never the business's: placeholders, website builders, error trackers, images
const JUNK = /(example\.|domain\.com|email\.com|yourname|sentry|wixpress|godaddy|squarespace|wordpress|cloudflare|\.(png|jpe?g|gif|webp|svg|css|js)$|^[0-9a-f]{20,}@)/i;

function extract(html: string) {
  const decoded = html
    .replace(/&#64;|&#x40;|\[at\]|\(at\)/gi, "@")
    .replace(/&#46;|\[dot\]|\(dot\)/gi, ".");
  const mailtos = [...decoded.matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => decodeURIComponent(m[1]));
  const plain = decoded.replace(/<[^>]+>/g, " ").match(EMAIL_RE) ?? [];
  return [...mailtos, ...plain].map((e) => e.trim().toLowerCase().replace(/[.,;:]+$/, ""));
}

/** A same-site link to a contact / about page, if the home page has one */
function contactLink(html: string, base: string) {
  const links = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const pick = links.find((m) => /contact/i.test(m[1] + m[2])) ?? links.find((m) => /about/i.test(m[1] + m[2]));
  if (!pick) return null;
  try {
    const u = new URL(pick[1], base);
    return u.hostname === new URL(base).hostname ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Emails published on the business's website, best first (on the site's own domain first).
 * Returns [] when none are found (many small sites only have a contact form).
 */
export async function findEmails(website: string): Promise<string[]> {
  const start = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  let home: Awaited<ReturnType<typeof fetchPage>>;
  try { home = await fetchPage(start); } catch { return []; }
  if (!home) return [];
  const found = extract(home.html);
  const more = contactLink(home.html, home.url);
  if (more) {
    const page = await fetchPage(more);
    if (page) found.push(...extract(page.html));
  }
  const domain = new URL(home.url).hostname.replace(/^www\./, "");
  const ONE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i;
  return [...new Set(found)]
    .filter((e) => ONE_EMAIL.test(e) && !JUNK.test(e))
    .sort((a, b) => Number(b.endsWith("@" + domain) || b.endsWith("." + domain)) - Number(a.endsWith("@" + domain) || a.endsWith("." + domain)))
    .slice(0, 5);
}
