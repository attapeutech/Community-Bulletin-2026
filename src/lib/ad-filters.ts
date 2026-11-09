import { and, isNull, sql } from "drizzle-orm";
import { ads } from "@/lib/db/schema";

/**
 * Ads that belong in admin and store lists. Leaves out sales work in progress:
 * - demo ads (managed on their lead's page in Sales)
 * - an unpaid copy made by a proposal's Pay button (checkout not finished); it shows up once it's paid
 */
export const listedAd = and(
  isNull(ads.demoId),
  sql`not (${ads.paymentStatus} = 'unpaid' and exists (select 1 from proposals where proposals.ad_id = ${ads.id}))`,
)!;
