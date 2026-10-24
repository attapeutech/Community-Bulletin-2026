"use client";

import { useEffect, useState } from "react";
import { safeNext } from "@/lib/safe-redirect";

/** Reads ?callbackUrl= from the address bar (after mount, so no Suspense boundary is needed). */
export function useNextParam(fallback = "/dashboard") {
  const [next, setNext] = useState(fallback);
  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get("callbackUrl"), fallback));
  }, [fallback]);
  return next;
}
