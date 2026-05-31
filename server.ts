import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = Number(process.env.PORT) || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
  });

  // Track last refresh time per location slug so late-joining clients get an immediate refresh
  const lastRefresh: Record<string, number> = {};

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("join:display", (slug: string) => {
      socket.join(`display:${slug}`);
      console.log(`[Socket] ${socket.id} joined display:${slug}`);
      // If a refresh was emitted in the last 5 minutes, replay it so recovering screens catch up
      if (lastRefresh[slug] && Date.now() - lastRefresh[slug] < 300_000) {
        socket.emit("ads:refresh", { slug });
      }
    });

    socket.on("join:dashboard", () => {
      socket.join("dashboard");
      console.log(`[Socket] ${socket.id} joined dashboard`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  (global as any).__lastRefresh = lastRefresh;

  // Make io available to API routes via global
  (global as any).__io = io;

  httpServer.listen(PORT, () => {
    console.log(`[Server] Next.js + Socket.io running on port ${PORT}`);
  });
});
