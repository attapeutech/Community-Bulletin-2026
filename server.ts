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

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("join:display", (slug: string) => {
      socket.join(`display:${slug}`);
      console.log(`[Socket] ${socket.id} joined display:${slug}`);
    });

    socket.on("join:dashboard", () => {
      socket.join("dashboard");
      console.log(`[Socket] ${socket.id} joined dashboard`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Make io available to API routes via global
  (global as any).__io = io;

  httpServer.listen(PORT, () => {
    console.log(`[Server] Next.js + Socket.io running on port ${PORT}`);
  });
});
