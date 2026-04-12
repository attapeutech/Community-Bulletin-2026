import Link from "next/link";
import { Icon } from "./Icon";

type LogoVariant = "full" | "icon-only" | "wordmark-only";
type LogoTheme = "dark" | "light";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  iconSize?: number;
  href?: string;
  className?: string;
}

export function Logo({
  variant = "full",
  theme = "dark",
  iconSize = 48,
  href = "/",
  className = "",
}: LogoProps) {
  const content = (
    <span className={`flex items-center gap-3 ${className}`}>
      {variant !== "wordmark-only" && (
        <span className="flex-shrink-0 rounded-xl bg-[#E8EFF6] p-2 flex items-center justify-center">
          <Icon size={iconSize} />
        </span>
      )}
      {variant !== "icon-only" && (
        <span className="flex flex-col leading-none">
          <span
            className="font-serif font-bold tracking-tight"
            style={{
              fontSize: iconSize * 0.45,
              color: theme === "dark" ? "#ffffff" : "#1A3A5C",
              lineHeight: 1.1,
            }}
          >
            Community
          </span>
          <span
            className="font-serif font-bold tracking-tight"
            style={{ fontSize: iconSize * 0.45, lineHeight: 1.1 }}
          >
            <span style={{ color: "#E8563A" }}>Bulletin</span>
            <span
              style={{
                color: "#4A90C4",
                fontSize: iconSize * 0.26,
                fontFamily: "Arial, sans-serif",
                fontWeight: 400,
              }}
            >
              .com
            </span>
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
