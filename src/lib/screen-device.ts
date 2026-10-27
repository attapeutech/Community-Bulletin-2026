// Browser side of remote screen assignment: a random device id plus the location this
// screen was last assigned to (so it goes straight there after a reboot). Storage can be
// unavailable (private mode, kiosk policies), so every access is guarded.

const DEVICE_KEY = "cb-screen-device";
const SLUG_KEY = "cb-screen-slug";

function read(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

let sessionId: string | null = null;
export function screenDeviceId() {
  const saved = read(DEVICE_KEY);
  if (saved) return saved;
  const id = sessionId ?? (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
  sessionId = id;
  write(DEVICE_KEY, id);
  return id;
}

export const assignedScreenSlug = () => read(SLUG_KEY);

/** Report in; returns the assigned location slug (null = not assigned). Throws on network errors. */
export async function screenCheckin(path: string): Promise<string | null> {
  const res = await fetch("/api/display/screen/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: screenDeviceId(), path }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const slug: string | null = json?.data?.assignedSlug ?? null;
  write(SLUG_KEY, slug);
  return slug;
}

/** Send the whole browser tab (even from inside the Live Ads iframe) to a location's screen */
export function goToScreen(slug: string) {
  const target = `/display/${encodeURIComponent(slug)}`;
  try {
    (window.top ?? window).location.href = target;
  } catch {
    window.location.href = target;
  }
}
