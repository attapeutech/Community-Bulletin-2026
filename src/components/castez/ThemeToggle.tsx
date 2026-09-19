"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ICON_BUTTON } from "./navStyles";

/** CastEZ-styled theme toggle. The app's original lives in components/layout
 *  and is painted with the old blue-grey palette. */
export function CeThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reserve the space so the nav doesn't shift once the theme resolves.
  if (!mounted) return <div className={`h-[34px] w-[34px] ${className}`} aria-hidden="true" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`${ICON_BUTTON} ${className}`}
    >
      {isDark ? <Moon size={17} strokeWidth={1.7} /> : <Sun size={17} strokeWidth={1.7} />}
    </button>
  );
}
