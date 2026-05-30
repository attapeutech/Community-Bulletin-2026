import type { Server } from "socket.io";

function getIO(): Server | undefined {
  return (global as any).__io as Server | undefined;
}

export function notifyDisplayScreen(slug: string) {
  getIO()?.to(`display:${slug}`).emit("ads:refresh", { slug });
}

export function notifyDashboard(payload: {
  adId: string;
  status: string;
  locationSlug: string;
}) {
  getIO()?.to("dashboard").emit("ad:status_changed", payload);
}
