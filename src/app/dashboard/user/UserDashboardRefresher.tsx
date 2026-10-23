"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDashboardSocket } from "@/lib/socket/client";

const STATUS_LABELS: Record<string, string> = {
  approved:  "approved and is now live",
  denied:    "denied",
  cancelled: "cancelled",
  expired:   "expired",
  pending:   "back in review",
};

export function UserDashboardRefresher({ adIds }: { adIds: string[] }) {
  const router = useRouter();

  const handleStatusChange = useCallback(
    ({ adId, status }: { adId: string; status: string; locationSlug: string }) => {
      if (!adIds.includes(adId)) return;
      router.refresh();
      const label = STATUS_LABELS[status] ?? status;
      toast.info(`Your ad has been ${label}.`, { duration: 5000 });
    },
    [adIds, router]
  );

  useDashboardSocket(handleStatusChange);

  return null;
}
