export type SavedLocation = {
  stateCode: string;
  stateName: string;
  cityName: string;
};

const LS_KEY = "cb_location_v1";

export function readSavedLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

export function writeSavedLocation(loc: SavedLocation | null): void {
  try {
    if (loc) localStorage.setItem(LS_KEY, JSON.stringify(loc));
    else localStorage.removeItem(LS_KEY);
  } catch {}
}
