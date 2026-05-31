import type { Server } from "socket.io";

function getIO(): Server | undefined {
  const io = (global as any).__io as Server | undefined;
  if (!io) console.warn("[Socket] __io not found on global — emit skipped");
  return io;
}

export function notifyDisplayScreen(slug: string) {
  const io = getIO();
  if (io) {
    console.log(`[Socket] Emitting ads:refresh to display:${slug}`);
    // Record refresh time so late-joining clients get an immediate replay
    const lastRefresh = (global as any).__lastRefresh as Record<string, number> | undefined;
    if (lastRefresh) lastRefresh[slug] = Date.now();
    io.to(`display:${slug}`).emit("ads:refresh", { slug });
  }
}

export function notifyDashboard(payload: {
  adId: string;
  status: string;
  locationSlug: string;
}) {
  const io = getIO();
  if (io) {
    console.log(`[Socket] Emitting ad:status_changed`, payload);
    io.to("dashboard").emit("ad:status_changed", payload);
  }
}
