"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/** CastEZ-styled theme toggle. The app's original lives in components/layout
 *  and is painted with the old blue-grey palette. */
export function CeThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reserve the space so the nav doesn't shift once the theme resolves.
  if (!mounted) return <div className="h-8 w-8" aria-hidden="true" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`rounded-lg p-1.5 text-ce-muted transition-colors hover:bg-ce-text/5 hover:text-ce-text ${className}`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
