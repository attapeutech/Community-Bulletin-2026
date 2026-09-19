"use client";

import { useSession } from "@/lib/auth/client";
import { GetStartedLink, LogInLink } from "./NavItems";
import { UserMenu } from "./UserMenu";

/**
 * Session-aware nav tail. Kept as its own client island so the surrounding
 * Nav can stay a server component. Signed out it is the design's Log in +
 * Get started free pair; signed in it becomes the account menu.
 */
export function NavAuth({ stacked = false }: { stacked?: boolean }) {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  // Placeholder of roughly the right width so the nav doesn't jump on hydration.
  if (isPending) {
    return <div className={stacked ? "h-10 w-full" : "h-9 w-[170px]"} aria-hidden="true" />;
  }

  if (user) {
    return <UserMenu user={user} stacked={stacked} />;
  }

  return (
    <div className={stacked ? "flex flex-col gap-2.5" : "flex items-center gap-2.5"}>
      <LogInLink className={stacked ? "text-center" : ""} />
      <GetStartedLink className={stacked ? "text-center" : ""} />
    </div>
  );
}
