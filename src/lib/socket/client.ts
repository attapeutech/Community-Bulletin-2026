"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      transports: ["websocket", "polling"],
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

    socket.emit("join:display", slug);
    socket.on("ads:refresh", onRefresh);

    return () => {
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
    socket.emit("join:dashboard");
    socket.on("ad:status_changed", onAdStatusChanged);

    return () => {
      socket.off("ad:status_changed", onAdStatusChanged);
    };
  }, [onAdStatusChanged]);
}
