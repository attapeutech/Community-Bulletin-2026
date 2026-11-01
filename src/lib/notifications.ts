import { db } from "@/lib/db/client";
import { ads, appointments, leads, locations, notifications, payments, users } from "@/lib/db/schema";
import { and, eq, gt, gte, inArray, isNull, lt, lte, notExists, sql, type SQL } from "drizzle-orm";
import { notifyUserSocket } from "@/lib/socket/server";
import { LEADS_TZ, leadToday } from "@/lib/leads";
import { appointmentType } from "@/lib/appointments";

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

/** A payment was recorded: tell the advertiser, the reviewers, and the store owner.
 *  `live`: a sales proposal ad, which goes live without review (so no "waiting for review"). */
export async function notifyPaymentRecorded(paymentId: string, { live = false }: { live?: boolean } = {}) {
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
      body: `${money(row.amountCents)} paid. ${live ? "Your ad is going live now." : "Your ad is now waiting for review."}`,
      link: `/dashboard/user/ads/${row.adId}`,
    });

    if (!live) await notifyRoles(["approver", "admin"], {
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
        body: live ? `"${row.adTitle}" was paid for and is running now.` : `"${row.adTitle}" was paid for and will run once approved.`,
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

// ─── Sales calendar ──────────────────────────────────────────────────────────

/** "2:00 PM", Pacific (the sales team's time zone; the server runs in UTC) */
const pacificTime = (d: Date) => d.toLocaleTimeString("en-US", { timeZone: LEADS_TZ, hour: "numeric", minute: "2-digit" });

/** Appointments in a window, with who to remind: whoever made it, else the lead's owner */
function appointmentsBetween(from: Date, to: Date, extra?: SQL) {
  return db
    .select({
      id: appointments.id,
      leadId: appointments.leadId,
      type: appointments.type,
      startsAt: appointments.startsAt,
      businessName: leads.businessName,
      recipient: sql<string | null>`coalesce(${appointments.createdBy}, ${leads.ownerId})`,
    })
    .from(appointments)
    .innerJoin(leads, eq(appointments.leadId, leads.id))
    .where(and(gte(appointments.startsAt, from), lt(appointments.startsAt, to), extra))
    .orderBy(appointments.startsAt);
}

/** Daily job: each salesperson's appointments for today (Pacific), in one bell notification, once a day */
export async function notifyTodaysAppointments(now = new Date()) {
  const today = leadToday(now);
  // A wide window, then keep the ones on today's Pacific date
  const rows = (await appointmentsBetween(new Date(now.getTime() - 12 * 3600_000), new Date(now.getTime() + 36 * 3600_000)))
    .filter(r => r.recipient && leadToday(r.startsAt) === today);

  const byUser = new Map<string, typeof rows>();
  for (const r of rows) byUser.set(r.recipient!, [...(byUser.get(r.recipient!) ?? []), r]);

  let sent = 0;
  for (const [userId, list] of byUser) {
    const [already] = await db.select({ id: notifications.id }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.type, "appointments_today"), gt(notifications.createdAt, new Date(now.getTime() - 20 * 3600_000))))
      .limit(1);
    if (already) continue;
    const shown = list.slice(0, 4).map(a => `${pacificTime(a.startsAt)} ${appointmentType(a.type).label} · ${a.businessName}`);
    if (list.length > 4) shown.push(`+${list.length - 4} more`);
    await notifyUser(userId, {
      type: "appointments_today",
      subject: `${list.length} appointment${list.length !== 1 ? "s" : ""} today`,
      body: shown.join(", "),
      link: "/dashboard/sales/calendar",
    });
    sent++;
  }
  return sent;
}

/** Every-15-minutes job: remind about appointments starting within the next hour, once each */
export async function notifyAppointmentsSoon(now = new Date()) {
  const rows = await appointmentsBetween(now, new Date(now.getTime() + 60 * 60_000), isNull(appointments.reminderSentAt));
  let sent = 0;
  for (const a of rows) {
    if (a.recipient) {
      await notifyUser(a.recipient, {
        type: "appointment_soon",
        subject: `${appointmentType(a.type).label} with ${a.businessName} at ${pacificTime(a.startsAt)}`,
        body: "Starting within the hour",
        link: `/dashboard/sales/${a.leadId}`,
      });
      sent++;
    }
    await db.update(appointments).set({ reminderSentAt: now }).where(eq(appointments.id, a.id));
  }
  return sent;
}
