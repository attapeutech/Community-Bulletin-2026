// Sales proposals (client-safe helpers; the payment hook is in proposal-payments.ts)

/** Unguessable token for the advertiser's private link (32 hex characters) */
export const newProposalToken = () => crypto.randomUUID().replace(/-/g, "");

/** The advertiser's proposal page */
export const proposalPath = (token: string) => `/p/${token}`;

export type ProposalStatus = "sent" | "viewed" | "accepted" | "paid" | "expired";

export function proposalStatus(p: { viewedAt: string | null; acceptedAt: string | null; paidAt: string | null }, expiresAt: string, now = new Date()): ProposalStatus {
  if (p.paidAt) return "paid";
  if (new Date(expiresAt) < now) return "expired";
  if (p.acceptedAt) return "accepted";
  if (p.viewedAt) return "viewed";
  return "sent";
}

export const PROPOSAL_STATUS: Record<ProposalStatus, { label: string; chip: string }> = {
  sent:     { label: "Sent",     chip: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-100 dark:border-white/20" },
  viewed:   { label: "Viewed",   chip: "bg-blue-50 text-blue-800 border-blue-200" },
  accepted: { label: "Accepted", chip: "bg-amber-50 text-amber-800 border-amber-200" },
  paid:     { label: "Paid",     chip: "bg-green-50 text-green-800 border-green-200" },
  expired:  { label: "Expired",  chip: "bg-red-50 text-red-700 border-red-200" },
};

/** The message the compose page starts with; the sales manager edits it before sending */
export function defaultProposalMessage(o: { contactName: string | null; businessName: string; storeName: string; shoppers: number | null; price: string }) {
  const hi = o.contactName ? `Hi ${o.contactName.split(" ")[0]},` : "Hi,";
  const reach = o.shoppers ? ` About ${o.shoppers.toLocaleString("en-US")} shoppers visit ${o.storeName} every day.` : "";
  return `${hi}

Thanks for talking with us. We made an ad for ${o.businessName} to show on the Community Bulletin screen at ${o.storeName}.${reach}

Click the button below to see it playing just as it would on the screen. If you like it, you can pay online in a minute, no sign-up needed: ${o.price} for 4 weeks, and it starts right away.

Want any changes? Just reply to this email.`;
}

/** The text message a salesperson sends with a proposal link (from their own phone) */
export function proposalTextMessage(o: { contactName: string | null; businessName: string; storeName: string; url: string }) {
  const hi = o.contactName ? `Hi ${o.contactName.split(" ")[0]}, ` : "Hi, ";
  return `${hi}here's the ad we made for ${o.businessName} on the Community Bulletin screen at ${o.storeName}. See it and pay in a minute, no sign-up needed: ${o.url}`;
}

/** Opens the phone's messaging app with the number and message filled in ("?&body=" works on iPhone and Android) */
export function smsHref(phone: string | null, body: string) {
  const to = (phone ?? "").replace(/[^\d+]/g, "");
  return `sms:${to}?&body=${encodeURIComponent(body)}`;
}
