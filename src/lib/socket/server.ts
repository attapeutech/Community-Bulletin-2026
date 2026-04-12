import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Each display screen joins a room named after its location slug
// e.g. room: "display:whole-foods-seattle-98101"
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Display screen joins its location room
  socket.on("join:display", (slug: string) => {
    const room = `display:${slug}`;
    socket.join(room);
    console.log(`[Socket] ${socket.id} joined room ${room}`);
  });

  // Admin/approver dashboard joins for live ad list updates
  socket.on("join:dashboard", () => {
    socket.join("dashboard");
    console.log(`[Socket] ${socket.id} joined dashboard room`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

/**
 * Emit to a specific display screen to reload its approved ads.
 * Called from the ad approval API route.
 */
export function notifyDisplayScreen(slug: string) {
  io.to(`display:${slug}`).emit("ads:refresh", { slug });
}

/**
 * Emit to all dashboard viewers that an ad status has changed.
 */
export function notifyDashboard(payload: {
  adId: string;
  status: string;
  locationSlug: string;
}) {
  io.to("dashboard").emit("ad:status_changed", payload);
}

const PORT = Number(process.env.SOCKET_PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Socket] Server running on port ${PORT}`);
});
