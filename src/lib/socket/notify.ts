import { notifyDisplayScreen, notifyDashboard } from "./server";

export async function pushDisplayRefresh(slug: string) {
  notifyDisplayScreen(slug);
}

export async function pushDashboardUpdate(payload: {
  adId: string;
  status: string;
  locationSlug: string;
}) {
  notifyDashboard(payload);
}
