import { requireAdmin } from "@/lib/auth/session";
import { GeoManagerClient } from "./GeoManagerClient";

export default async function GeoManagerPage() {
  await requireAdmin();
  return <GeoManagerClient />;
}
