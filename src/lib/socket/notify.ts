/**
 * Notify the Socket.io server from Next.js API routes.
 * The socket server runs as a separate process; we communicate via HTTP.
 */
const SOCKET_INTERNAL_URL =
  process.env.SOCKET_INTERNAL_URL ||
  `http://localhost:${process.env.SOCKET_PORT || 3001}`;

async function post(body: object) {
  try {
    await fetch(`${SOCKET_INTERNAL_URL}/internal/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Non-fatal — display screen will refresh on next poll / manual reload
    console.warn("[Socket notify] Could not reach socket server");
  }
}

/** Push an ads:refresh event to all TVs at a given location slug. */
export async function pushDisplayRefresh(slug: string) {
  await post({ type: "display", slug });
}

/** Push an ad:status_changed event to all open dashboards. */
export async function pushDashboardUpdate(payload: {
  adId: string;
  status: string;
  locationSlug: string;
}) {
  await post({ type: "dashboard", ...payload });
}
