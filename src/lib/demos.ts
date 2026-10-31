import { addDays } from "date-fns";

// A demo link works for 30 days; "Extend" restarts the 30 days
export const DEMO_DAYS = 30;

export const demoExpiry = (from = new Date()) => addDays(from, DEMO_DAYS);

/** Unguessable token for the private link (32 hex characters, 122 random bits) */
export const newDemoToken = () => crypto.randomUUID().replace(/-/g, "");

/** Path of a demo's private screen: the store's real screen with the demo ads mixed in */
export const demoPath = (locationSlug: string, token: string) => `/display/${locationSlug}?demo=${token}`;
