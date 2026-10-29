import { db } from "@/lib/db/client";
import { ads, leads, locations, notifications, payments, users } from "@/lib/db/schema";
import { and, eq, gt, inArray, lte, notExists, sql } from "drizzle-orm";
import { notifyUserSocket } from "@/lib/socket/server";
import { leadToday } from "@/lib/leads";

type NotificationType = typeof notifications.$inferInsert["type"];

type NotifyInput = {
  type: NotificationType;
  subject: string;
  body?: string;
  adId?: string | null;
  link?: string | null;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Saves an in-app notification and pushes it to the user's open tabs.
 * The database row is the source of truth; the socket push is just a nudge.
 * Never throws — a failed notification must not break the action that caused it.
 */
export async function notifyUser(userId: string, input: NotifyInput) {
  try {
    const [row] = await db
      .insert(notifications)
      .values({
        userId,
        adId: input.adId ?? null,
        type: input.type,
        channel: "socket",
        status: "sent",
        subject: input.subject,
        body: input.body ?? null,
        link: input.link ?? null,
        sentAt: new Date(),
      })
      .returning();
    notifyUserSocket(userId, row);
  } catch (err) {
    console.error("[notifications] notifyUser failed", input.type, err);
  }
}

export async function notifyRoles(roles: ("approver" | "admin")[], input: NotifyInput) {
  const recipients = await db.select({ id: users.id }).from(users).where(inArray(users.role, roles));
  await Promise.all(recipients.map(r => notifyUser(r.id, input)));
}

// ─── Events ──────────────────────────────────────────────────────────────────

/** A payment was recorded: tell the advertiser, the reviewers, and the store owner. */
export async function notifyPaymentRecorded(paymentId: string) {
  try {
    const [row] = await db
      .select({
        adId:        ads.id,
        adTitle:     ads.title,
        advertiser:  ads.userId,
        amountCents: payments.amountCents,
        storeName:   locations.storeName,
        ownerId:     users.id,
        ownerRole:   users.role,
      })
      .from(payments)
      .innerJoin(ads, eq(payments.adId, ads.id))
      .innerJoin(locations, eq(ads.locationId, locations.id))
      .innerJoin(users, eq(locations.storeOwnerId, users.id))
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!row) return;

    await notifyUser(row.advertiser, {
      type: "payment_received",
      adId: row.adId,
      subject: `Payment received for "${row.adTitle}"`,
      body: `${money(row.amountCents)} paid. Your ad is now waiting for review.`,
      link: `/dashboard/user/ads/${row.adId}`,
    });

    await notifyRoles(["approver", "admin"], {
      type: "ad_pending_review",
      adId: row.adId,
      subject: `New ad to review: "${row.adTitle}"`,
      body: `Paid and waiting for approval at ${row.storeName}.`,
      link: "/dashboard/approver",
    });

    // Admin-owned stores already hear about it as reviewers
    if (row.ownerRole !== "admin") {
      await notifyUser(row.ownerId, {
        type: "store_ad_paid",
        adId: row.adId,
        subject: `New ad booked at ${row.storeName}`,
        body: `"${row.adTitle}" was paid for and will run once approved.`,
        link: "/dashboard/store-owner/earnings",
      });
    }
  } catch (err) {
    console.error("[notifications] notifyPaymentRecorded failed", err);
  }
}

export async function notifyAdApproved(adId: string, userId: string, adTitle: string, endedAt: Date) {
  await notifyUser(userId, {
    type: "ad_approved",
    adId,
    subject: `"${adTitle}" is live`,
    body: `Approved and showing until ${endedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}.`,
    link: `/dashboard/user/ads/${adId}`,
  });
}

export async function notifyAdDenied(adId: string, userId: string, adTitle: string, refunded: boolean) {
  await notifyUser(userId, {
    type: "ad_denied",
    adId,
    subject: `"${adTitle}" was not approved`,
    body: refunded ? "A full refund has been issued. See the reviewer's note for details." : "See the reviewer's note for details.",
    link: `/dashboard/user/ads/${adId}`,
  });
}

export async function notifyAdCancelled(adId: string, userId: string, adTitle: string, refunded: boolean) {
  await notifyUser(userId, {
    type: "ad_cancelled",
    adId,
    subject: `"${adTitle}" was cancelled`,
    body: refunded ? "A full refund has been issued." : undefined,
    link: `/dashboard/user/ads/${adId}`,
  });
}

/** Cron: tell advertisers their ads have expired. */
export async function notifyAdsExpired(adIds: string[]) {
  if (adIds.length === 0) return;
  const rows = await db.select({ id: ads.id, userId: ads.userId, title: ads.title }).from(ads).where(inArray(ads.id, adIds));
  for (const ad of rows) {
    await notifyUser(ad.userId, {
      type: "ad_expired",
      adId: ad.id,
      subject: `"${ad.title}" has ended`,
      body: "Its run is over. Renew it to keep it on screen.",
      link: `/dashboard/user/ads/${ad.id}`,
    });
  }
}

/** Cron: warn advertisers once per run when their ad ends within 24 hours. */
export async function notifyAdsExpiringSoon(now = new Date()) {
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ id: ads.id, userId: ads.userId, title: ads.title, endedAt: ads.endedAt })
    .from(ads)
    .where(and(
      eq(ads.status, "approved"),
      eq(ads.isTest, false),
      gt(ads.endedAt, now),
      lte(ads.endedAt, in24h),
      notExists(
        db.select({ one: sql`1` })
          .from(notifications)
          .where(and(
            eq(notifications.adId, ads.id),
            eq(notifications.type, "ad_expiring"),
            gt(notifications.createdAt, ads.startedAt),
          ))
      ),
    ));

  for (const ad of rows) {
    await notifyUser(ad.userId, {
      type: "ad_expiring",
      adId: ad.id,
      subject: `"${ad.title}" ends soon`,
      body: `Its run ends ${ad.endedAt!.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}. Renew to keep it showing.`,
      link: `/dashboard/user/ads/${ad.id}`,
    });
  }
  return rows.length;
}

export async function notifyEarningsAvailable(ownerId: string, amountCents: number, count: number) {
  await notifyUser(ownerId, {
    type: "earnings_available",
    subject: `${money(amountCents)} in earnings now available`,
    body: `From ${count} finished ad run${count !== 1 ? "s" : ""}. It will be included in your next monthly payout.`,
    link: "/dashboard/store-owner/earnings",
  });
}

export async function notifyPayoutSent(ownerId: string, amountCents: number, method: "zelle" | "check" | "stripe") {
  await notifyUser(ownerId, {
    type: "payout_sent",
    subject: `Payout of ${money(amountCents)} sent`,
    body: method === "stripe" ? "Sent by direct deposit. It usually reaches your bank in 2–3 business days."
      : method === "zelle" ? "Sent via Zelle." : "Sent by mailed check.",
    link: "/dashboard/store-owner/earnings",
  });
}

/**
 * Daily job: one bell reminder per lead owner with follow-ups due today or overdue.
 * At most one a day, even if the job runs more than once.
 */
export async function notifyLeadFollowUps(now = new Date()) {
  const today = leadToday(now);
  const rows = await db
    .select({
      ownerId: leads.ownerId,
      stores: sql<number>`count(*) filter (where ${leads.kind} = 'store_partner')::int`,
      advertisers: sql<number>`count(*) filter (where ${leads.kind} <> 'store_partner')::int`,
    })
    .from(leads)
    .where(and(
      inArray(leads.stage, ["new", "contacted", "interested"]),
      lte(leads.nextFollowUp, today),
      sql`${leads.ownerId} is not null`,
    ))
    .groupBy(leads.ownerId);

  let sent = 0;
  for (const r of rows) {
    const due = r.stores + r.advertisers;
    const [already] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.userId, r.ownerId!),
        eq(notifications.type, "lead_follow_up"),
        gt(notifications.createdAt, new Date(now.getTime() - 20 * 60 * 60 * 1000)),
      ))
      .limit(1);
    if (already) continue;
    await notifyUser(r.ownerId!, {
      type: "lead_follow_up",
      subject: `${due} lead${due !== 1 ? "s" : ""} to follow up today`,
      body: [r.stores && `${r.stores} store${r.stores !== 1 ? "s" : ""}`, r.advertisers && `${r.advertisers} advertiser${r.advertisers !== 1 ? "s" : ""}`]
        .filter(Boolean).join(", ") + " (includes overdue)",
      // Open the tab that has follow-ups due (stores come first in the process)
      link: `/dashboard/sales?${r.stores ? "kind=store_partner&" : ""}due=due&owner=me`,
    });
    sent++;
  }
  return sent;
}
