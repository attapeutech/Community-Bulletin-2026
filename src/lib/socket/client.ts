"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      transports: ["polling", "websocket"],
      autoConnect: true,
    });
  }
  return socketInstance;
}

export function useDisplaySocket(slug: string, onRefresh: () => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    function joinRoom() {
      socket.emit("join:display", slug);
      // Fetch latest ads immediately on every (re)connect — don't rely on
      // socket event delivery which can be lost during polling reconnects
      onRefresh();
    }

    // Re-join on every connect/reconnect so we're always in the room
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on("ads:refresh", onRefresh);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("ads:refresh", onRefresh);
    };
  }, [slug, onRefresh]);
}

export function useDashboardSocket(
  onAdStatusChanged: (payload: {
    adId: string;
    status: string;
    locationSlug: string;
  }) => void
) {
  useEffect(() => {
    const socket = getSocket();

    function joinRoom() {
      socket.emit("join:dashboard");
    }

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on("ad:status_changed", onAdStatusChanged);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("ad:status_changed", onAdStatusChanged);
    };
  }, [onAdStatusChanged]);
}

// ── /notifications namespace ─────────────────────────────────────────────────
// Separate from the default-namespace socket above (display screens + dashboard).
// Shares the same underlying connection; the server authenticates it from the
// session cookie and puts it in the user's private room.
let notificationsSocket: Socket | null = null;

function getNotificationsSocket(): Socket {
  if (!notificationsSocket) {
    notificationsSocket = io("/notifications", {
      transports: ["polling", "websocket"],
      autoConnect: true,
    });
  }
  return notificationsSocket;
}

export function useNotificationsSocket(
  onNotification: (payload: unknown) => void,
  onConnect: () => void
) {
  useEffect(() => {
    const socket = getNotificationsSocket();

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("connect", onConnect);
      socket.off("notification:new", onNotification);
    };
  }, [onNotification, onConnect]);
}
