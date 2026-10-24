"use client";

import { useEffect, useSyncExternalStore } from "react";

// One shared copy of the signed-in user's saved ad ids for the whole page,
// so a grid of heart buttons loads the list once and stays in sync.
let saved = new Set<string>();
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => saved;

function load() {
  if (loaded || loading) return loading;
  loading = fetch("/api/saved", { cache: "no-store" })
    .then(r => (r.ok ? r.json() : null))
    .then(json => {
      if (json?.success) saved = new Set(json.data.adIds as string[]);
      loaded = true;
      emit();
    })
    .catch(() => { /* leave empty; hearts still work */ })
    .finally(() => { loading = null; });
  return loading;
}

/** Saved ad ids for the signed-in user (empty when signed out). */
export function useSavedAds(signedIn: boolean) {
  useEffect(() => {
    if (signedIn) load();
  }, [signedIn]);
  return useSyncExternalStore(subscribe, snapshot, () => saved);
}

/** Save or unsave an ad, updating every heart on the page immediately. Returns false if the server refused. */
export async function setSaved(adId: string, value: boolean) {
  const next = new Set(saved);
  if (value) next.add(adId); else next.delete(adId);
  saved = next;
  emit();
  try {
    const res = value
      ? await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adId }) })
      : await fetch(`/api/saved?adId=${encodeURIComponent(adId)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(String(res.status));
    return true;
  } catch {
    // Roll back the optimistic change
    const undo = new Set(saved);
    if (value) undo.delete(adId); else undo.add(adId);
    saved = undo;
    emit();
    return false;
  }
}
