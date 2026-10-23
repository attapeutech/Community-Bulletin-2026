"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationsSocket } from "@/lib/socket/client";

type Item = {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell({
  variant = "light",
  align = "right",
}: {
  variant?: "light" | "dark";   // dark = on the navy dashboard sidebar
  align?: "left" | "right";     // which edge the dropdown lines up with
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // The database is the source of truth: refetch on (re)connect and on tab focus
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setUnread(json.data.unread);
      }
    } catch {
      // offline or signed out — keep what we have
    }
  }, []);

  const onNotification = useCallback((payload: unknown) => {
    const n = payload as Item;
    setItems(prev => (prev.some(i => i.id === n.id) ? prev : [n, ...prev].slice(0, 30)));
    setUnread(u => u + 1);
  }, []);

  useNotificationsSocket(onNotification, load);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markRead(body: { ids: string[] } | { all: true }) {
    const now = new Date().toISOString();
    setItems(prev => prev.map(i => (!i.readAt && ("all" in body || body.ids.includes(i.id)) ? { ...i, readAt: now } : i)));
    setUnread(u => ("all" in body ? 0 : Math.max(0, u - body.ids.length)));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      load();
    }
  }

  function openItem(item: Item) {
    if (!item.readAt) markRead({ ids: [item.id] });
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          variant === "dark"
            ? "text-[#9DC4E0] hover:bg-white/10 hover:text-white"
            : "text-[#1A3A5C] dark:text-[#9DC4E0] hover:bg-[#F4F7FB] dark:hover:bg-[#1E3550]"
        )}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8563A] text-white text-[10px] font-bold leading-[18px] text-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 w-[min(340px,calc(100vw-24px))] rounded-xl border border-[#D8E4EE] dark:border-[#1E3550] bg-white dark:bg-[#0F2236] shadow-xl overflow-hidden",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D8E4EE] dark:border-[#1E3550]">
            <span className="font-serif font-bold text-[15px] text-[#1A3A5C] dark:text-white">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markRead({ all: true })}
                className="text-[12px] font-semibold text-[#4A90C4] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#4A6B82] dark:text-[#9DC4E0]">
                You&apos;re all caught up.
              </div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex gap-3 border-b last:border-b-0 border-[#EEF3F8] dark:border-[#1E3550] hover:bg-[#F7F9FC] dark:hover:bg-[#13304D] transition-colors",
                    !item.readAt && "bg-[#F0F7FF] dark:bg-[#12304F]"
                  )}
                >
                  <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", item.readAt ? "bg-transparent" : "bg-[#E8563A]")} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[13px] text-[#1A3A5C] dark:text-white leading-snug", !item.readAt && "font-semibold")}>
                      {item.subject}
                    </span>
                    {item.body && (
                      <span className="block text-[12px] text-[#4A6B82] dark:text-[#9DC4E0] mt-0.5 leading-snug">{item.body}</span>
                    )}
                    <span className="block text-[11px] text-[#7A97AD] mt-1">{timeAgo(item.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
