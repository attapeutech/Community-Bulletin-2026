"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICON_BUTTON } from "./navStyles";

/**
 * Notifications bell from the design.
 *
 * The notifications table exists (lib/db/schema/notifications.ts) but nothing
 * serves it yet -- there is no /api/notifications route -- so this renders the
 * real empty state rather than the design's three sample rows, and shows no
 * unread dot until there is a count to believe in.
 */
export function NavBell() {
  const notifications: { id: string; title: string; meta: string }[] = [];
  const unread = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Notifications" className={`relative ${ICON_BUTTON}`}>
          <Bell size={17} strokeWidth={1.7} />
          {unread > 0 && (
            <span
              className="absolute right-[7px] top-[6px] h-[7px] w-[7px] rounded-full bg-ce-accent"
              style={{ boxShadow: "0 0 0 2px hsl(var(--ce-panel))" }}
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[296px] border-ce-line3 bg-ce-surface/95 p-0 backdrop-blur-[18px]"
        style={{ boxShadow: "0 30px 60px -30px rgba(0,0,0,.9)" }}
      >
        <div className="flex items-center justify-between border-b border-ce-line3 px-3.5 py-3">
          <span className="font-ce-mono text-[11px] tracking-[0.14em] text-ce-muted2">
            NOTIFICATIONS
          </span>
          {unread > 0 && (
            <span className="text-[11px] font-bold text-ce-accent">{unread} new</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-[13px] text-ce-muted3">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n) => (
              <div key={n.id} className="border-b border-ce-line2 px-3.5 py-3 last:border-b-0">
                <div className="mb-0.5 text-[13px] font-semibold text-ce-text">{n.title}</div>
                <div className="text-xs text-ce-muted3">{n.meta}</div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
