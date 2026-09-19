"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/client";
import { UserMenu } from "./UserMenu";

/**
 * Session-aware nav tail. Kept as its own client island so the surrounding
 * Nav can stay a server component.
 */
export function NavAuth({ stacked = false }: { stacked?: boolean }) {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  // Placeholder of roughly the right width so the nav doesn't jump on hydration.
  if (isPending) {
    return <div className={stacked ? "h-10 w-full" : "h-9 w-[150px]"} aria-hidden="true" />;
  }

  if (user) {
    return <UserMenu user={user} stacked={stacked} />;
  }

  return (
    <div className={stacked ? "flex flex-col gap-2.5" : "flex items-center gap-2"}>
      <Link
        href="/login"
        className={`rounded-[9px] border border-ce-line4 bg-ce-raised px-4 py-2 text-sm font-semibold text-ce-text3 ${
          stacked ? "text-center" : ""
        }`}
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className={`whitespace-nowrap rounded-[9px] bg-[linear-gradient(180deg,#5cf0dd,#2ad3bf)] px-4 py-2 text-sm font-bold text-ce-onAccent ${
          stacked ? "text-center" : ""
        }`}
        style={{ boxShadow: "0 0 24px rgba(62,230,209,.32)" }}
      >
        Get started free
      </Link>
    </div>
  );
}
