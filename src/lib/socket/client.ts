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
