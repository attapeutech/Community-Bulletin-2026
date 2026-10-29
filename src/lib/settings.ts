import { db } from "@/lib/db/client";
import { appSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// "Advertise here" slide shown on in-store display screens
export type AdvertiseSlideSettings = {
  enabled: boolean;
  headline: string;
  subline: string;     // "{store}" is replaced with the store's name
  everyNAds: number;   // shown after every N paid ads (and always when a store has none)
};

export const ADVERTISE_SLIDE_DEFAULTS: AdvertiseSlideSettings = {
  enabled: true,
  headline: "Your ad could be here",
  subline: "Reach every customer at {store}",
  everyNAds: 3,
};

const KEY = "advertise_slide";

export async function getAdvertiseSlideSettings(): Promise<AdvertiseSlideSettings> {
  try {
    const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, KEY)).limit(1);
    return { ...ADVERTISE_SLIDE_DEFAULTS, ...((row?.value as Partial<AdvertiseSlideSettings>) ?? {}) };
  } catch (err) {
    console.error("[settings] getAdvertiseSlideSettings failed", err);
    return ADVERTISE_SLIDE_DEFAULTS;
  }
}

export async function saveAdvertiseSlideSettings(value: AdvertiseSlideSettings) {
  await db
    .insert(appSettings)
    .values({ key: KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

// Display screen design: "classic" (header + footer, sliding carousel) or "brand"
// (Clean channel: brand frame + coral transition). Any screen can preview the other with
// ?preview=brand / ?preview=classic before an admin switches every screen.
export type DisplayDesign = "classic" | "brand";

const DESIGN_KEY = "display_design";

export async function getDisplayDesign(): Promise<DisplayDesign> {
  try {
    const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, DESIGN_KEY)).limit(1);
    return (row?.value as { design?: DisplayDesign } | undefined)?.design === "brand" ? "brand" : "classic";
  } catch (err) {
    console.error("[settings] getDisplayDesign failed", err);
    return "classic";
  }
}

export async function saveDisplayDesign(design: DisplayDesign) {
  const value = { design };
  await db
    .insert(appSettings)
    .values({ key: DESIGN_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}
