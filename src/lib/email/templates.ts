import { sendEmail, APPROVER_EMAIL, ADMIN_EMAIL, APP_URL } from "./index";

const BRAND_NAME = "CommunityBulletin.com";
const BRAND_COLOR = "#1A3A5C";
const ACCENT_COLOR = "#4A90C4";
const CORAL_COLOR = "#E8563A";

function emailWrapper(content: string) {
  return `
    <div style="font-family:Georgia,serif;max-width:580px;margin:0 auto;background:#ffffff">
      <!-- Header -->
      <div style="background:${BRAND_COLOR};padding:28px 40px;border-radius:10px 10px 0 0">
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff;line-height:1.1">
          Community<span style="color:${CORAL_COLOR}">Bulletin</span><span style="color:${ACCENT_COLOR};font-size:13px;font-family:sans-serif;font-weight:400">.com</span>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;font-family:sans-serif;letter-spacing:0.08em;text-transform:uppercase">
          Digital in-store advertising
        </div>
      </div>
      <!-- Body -->
      <div style="padding:36px 40px;border:1px solid #e2eaf2;border-top:none;border-radius:0 0 10px 10px;font-family:sans-serif">
        ${content}
      </div>
      <!-- Footer -->
      <div style="padding:20px 40px;text-align:center;font-size:11px;color:#9DC4E0;font-family:sans-serif">
        © ${new Date().getFullYear()} ${BRAND_NAME} · Digital in-store advertising
      </div>
    </div>
  `;
}

function primaryButton(href: string, label: string, color = BRAND_COLOR) {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:12px 28px;border-radius:7px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px">${label}</a>`;
}

function detailTable(rows: { label: string; value: string }[]) {
  const trs = rows.map(r => `
    <tr>
      <td style="padding:9px 12px;color:#4A6B82;font-size:13px;border-bottom:1px solid #e2eaf2;white-space:nowrap">${r.label}</td>
      <td style="padding:9px 12px;color:#1A3A5C;font-size:13px;border-bottom:1px solid #e2eaf2">${r.value}</td>
    </tr>`).join("");
  return `<table style="border-collapse:collapse;width:100%;margin:20px 0;border:1px solid #e2eaf2;border-radius:8px;overflow:hidden">${trs}</table>`;
}

// ─── Auth Emails ─────────────────────────────────────────────────────────────

export async function sendVerificationEmail({ to, name, url }: { to: string; name: string; url: string }) {
  return sendEmail({
    to,
    subject: `Verify your ${BRAND_NAME} email`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Welcome to ${BRAND_NAME}, ${name}!</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 24px">Please verify your email address to activate your account and start advertising in your community.</p>
      ${primaryButton(url, "Verify Email")}
      <p style="color:#9DC4E0;font-size:12px;margin-top:24px">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    `),
  });
}

export async function sendPasswordResetEmail({ to, name, url }: { to: string; name: string; url: string }) {
  return sendEmail({
    to,
    subject: `Reset your ${BRAND_NAME} password`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Password Reset Request</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 24px">Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.</p>
      ${primaryButton(url, "Reset Password")}
      <p style="color:#9DC4E0;font-size:12px;margin-top:24px">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
    `),
  });
}

export async function send2FACodeEmail({ to, name, code }: { to: string; name: string; code: string }) {
  return sendEmail({
    to,
    subject: `Your ${BRAND_NAME} verification code`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Sign-in verification code</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 24px">Hi ${name}, use the code below to complete your sign-in.</p>
      <div style="background:#F4F7FB;border-radius:10px;padding:28px;text-align:center;margin:0 0 24px">
        <span style="font-family:monospace;font-size:40px;font-weight:700;letter-spacing:0.35em;color:${BRAND_COLOR}">${code}</span>
      </div>
      <p style="color:#9DC4E0;font-size:12px">This code expires in 10 minutes. If you did not attempt to sign in, please change your password immediately.</p>
    `),
  });
}

// ─── Ad Emails ───────────────────────────────────────────────────────────────

export async function sendAdSubmittedEmail({
  to, userName, adTitle, locationName, adId,
}: {
  to: string; userName: string; adTitle: string; locationName: string; adId: string;
}) {
  return sendEmail({
    to,
    subject: `Ad submitted for review — "${adTitle}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Your ad has been submitted!</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">Hi ${userName}, your ad has been received and is now pending review. Our team will review it within 1–2 business days.</p>
      ${detailTable([
        { label: "Ad title", value: `<strong>${adTitle}</strong>` },
        { label: "Location", value: locationName },
        { label: "Status", value: '<span style="background:#fef9c3;color:#854d0e;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">Pending Review</span>' },
      ])}
      <p style="color:#4A6B82;font-size:13px">You'll receive an email as soon as a decision is made.</p>
      ${primaryButton(`${APP_URL}/dashboard/user/ads/${adId}`, "View Your Ad")}
    `),
  });
}

export async function sendAdReviewNotificationEmail({
  adTitle, locationName, userName, adId,
}: {
  adTitle: string; locationName: string; userName: string; adId: string;
}) {
  return sendEmail({
    to: APPROVER_EMAIL,
    cc: ADMIN_EMAIL !== APPROVER_EMAIL ? ADMIN_EMAIL : undefined,
    subject: `New ad pending review — "${adTitle}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">New ad submitted for review</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">A new ad has been submitted and is awaiting your review and approval.</p>
      ${detailTable([
        { label: "Ad title", value: `<strong>${adTitle}</strong>` },
        { label: "Submitted by", value: userName },
        { label: "Location", value: locationName },
        { label: "Status", value: '<span style="background:#fef9c3;color:#854d0e;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">Pending Review</span>' },
      ])}
      ${primaryButton(`${APP_URL}/dashboard/approver`, "Review Ad & Approve", "#16a34a")}
    `),
  });
}

export async function sendPaymentReceiptEmail({
  to, userName, adTitle, locationName, amountFormatted, provider, adId,
}: {
  to: string; userName: string; adTitle: string; locationName: string; amountFormatted: string; provider: string; adId: string;
}) {
  return sendEmail({
    to,
    subject: `Payment confirmed — "${adTitle}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:20px">Payment confirmed ✓</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">Hi ${userName}, your payment has been received. Your ad has been submitted for review.</p>
      ${detailTable([
        { label: "Ad title", value: `<strong>${adTitle}</strong>` },
        { label: "Location", value: locationName },
        { label: "Amount paid", value: `<strong style="color:${CORAL_COLOR}">${amountFormatted}</strong>` },
        { label: "Payment method", value: provider.charAt(0).toUpperCase() + provider.slice(1) },
        { label: "Duration", value: "1 month (30 days)" },
      ])}
      ${primaryButton(`${APP_URL}/dashboard/user/ads/${adId}`, "View Ad Details")}
    `),
  });
}

export async function sendAdApprovedEmail({
  to, userName, adTitle, locationName, locationSlug, adId, startedAt, endedAt,
}: {
  to: string; userName: string; adTitle: string; locationName: string;
  locationSlug: string; adId: string; startedAt: string; endedAt: string;
}) {
  const displayUrl = `${APP_URL}/display/${locationSlug}?ad=${adId}`;  // opens on this ad
  return sendEmail({
    to,
    subject: `Your ad is approved and live — "${adTitle}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:20px">Your ad is approved! 🎉</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">Hi ${userName}, great news! Your ad is now live on the in-store display screen at <strong>${locationName}</strong>.</p>
      ${detailTable([
        { label: "Ad title", value: `<strong>${adTitle}</strong>` },
        { label: "Location", value: locationName },
        { label: "Starts", value: startedAt },
        { label: "Ends", value: endedAt },
        { label: "Status", value: '<span style="background:#dcfce7;color:#16a34a;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">Approved & Live</span>' },
      ])}
      <div style="display:flex;gap:12px;margin-top:8px">
        ${primaryButton(displayUrl, "View Live Display", "#16a34a")}
        &nbsp;&nbsp;
        ${primaryButton(`${APP_URL}/dashboard/user/ads/${adId}`, "View Ad Details", BRAND_COLOR)}
      </div>
    `),
  });
}

export async function sendAdCancelledEmail({
  to, userName, adTitle, cancelNote, adId, amountFormatted, refundStatus,
}: {
  to: string; userName: string; adTitle: string; cancelNote: string; adId: string;
  amountFormatted: string; refundStatus: "refunded" | "refund_pending" | "no_payment";
}) {
  const refundNote = refundStatus === "no_payment"
    ? ""
    : refundStatus === "refunded"
      ? `<p style="color:#4A6B82;font-size:13px">A full refund of <strong>${amountFormatted}</strong> has been initiated to your original payment method and should appear within 5–10 business days.</p>`
      : `<p style="color:#4A6B82;font-size:13px">A full refund of <strong>${amountFormatted}</strong> is being processed. Our team will ensure it reaches you shortly.</p>`;

  return sendEmail({
    to,
    subject: `Ad cancelled — "${adTitle}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Ad cancelled</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">Hi ${userName}, your ad <strong>"${adTitle}"</strong> has been cancelled by our team.</p>
      <div style="background:#fff7ed;border-left:4px solid #f97316;padding:14px 18px;margin:0 0 20px;border-radius:0 8px 8px 0">
        <p style="margin:0;font-size:13px;color:#9a3412"><strong>Reason:</strong> ${cancelNote}</p>
      </div>
      ${refundNote}
      <p style="color:#4A6B82;font-size:13px">You are welcome to submit a new ad at any time.</p>
      ${primaryButton(`${APP_URL}/ads/new`, "Submit a New Ad")}
    `),
  });
}

export async function sendAdDeniedEmail({
  to, userName, adTitle, reviewNote, adId, amountFormatted, refundStatus,
}: {
  to: string; userName: string; adTitle: string; reviewNote: string; adId: string;
  amountFormatted: string; refundStatus: "refunded" | "refund_pending";
}) {
  const refundNote = refundStatus === "refunded"
    ? `A full refund of <strong>${amountFormatted}</strong> has been initiated to your original payment method and should appear within 5–10 business days.`
    : `A full refund of <strong>${amountFormatted}</strong> is being processed. Our team will ensure it reaches you shortly.`;

  return sendEmail({
    to,
    subject: `Ad review update — "${adTitle}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Ad review update</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">Hi ${userName}, after review your ad <strong>"${adTitle}"</strong> was not approved at this time.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;margin:0 0 20px;border-radius:0 8px 8px 0">
        <p style="margin:0;font-size:13px;color:#b91c1c"><strong>Reviewer note:</strong> ${reviewNote}</p>
      </div>
      <p style="color:#4A6B82;font-size:13px">${refundNote}</p>
      <p style="color:#4A6B82;font-size:13px">You are welcome to submit a revised ad at any time.</p>
      ${primaryButton(`${APP_URL}/ads/new`, "Submit a New Ad")}
    `),
  });
}

// ─── Store Owner Emails ──────────────────────────────────────────────────────

export async function sendPayoutSentEmail({
  to, ownerName, amountFormatted, method, reference, adCount,
}: {
  to: string; ownerName: string; amountFormatted: string; method: "zelle" | "check" | "stripe"; reference: string | null; adCount: number;
}) {
  const methodLabel = method === "stripe" ? "Direct deposit (usually arrives in 2–3 business days)" : method === "zelle" ? "Zelle" : "Mailed check";
  return sendEmail({
    to,
    subject: `Your CommunityBulletin payout of ${amountFormatted} is on its way`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:20px">Payout sent ✓</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">Hi ${ownerName}, we've sent your earnings from ads shown at your store.</p>
      ${detailTable([
        { label: "Amount", value: `<strong style="color:${CORAL_COLOR}">${amountFormatted}</strong>` },
        { label: "Method", value: methodLabel },
        ...(reference ? [{ label: method === "zelle" ? "Confirmation" : "Check number", value: reference }] : []),
        { label: "Ad runs included", value: String(adCount) },
      ])}
      ${primaryButton(`${APP_URL}/dashboard/store-owner/earnings`, "View Earnings")}
    `),
  });
}

/** After a direct-deposit run that paid someone or hit an error: what happened, for admins */
export async function sendDirectDepositSummaryEmail({ to, summary }: {
  to: string;
  summary: { period: string; trigger: "schedule" | "manual"; paid: { name: string; amountCents: number }[]; skipped: { name: string; amountCents: number; reason?: string }[]; failed: { name: string; amountCents: number; reason?: string }[] };
}) {
  const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
  const total = summary.paid.reduce((s, p) => s + p.amountCents, 0);
  const list = (rows: { name: string; amountCents: number; reason?: string }[]) =>
    rows.map(r => `<li style="margin:0 0 4px">${r.name}: <strong>${usd(r.amountCents)}</strong>${r.reason ? ` — ${r.reason}` : ""}</li>`).join("");
  return sendEmail({
    to,
    subject: `Direct deposits ${summary.period}: ${summary.paid.length} paid (${usd(total)})${summary.failed.length ? `, ${summary.failed.length} failed` : ""}`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Direct deposit run · ${summary.period}</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 16px">${summary.trigger === "manual" ? "Started by an admin." : "Automatic monthly run."}</p>
      ${summary.paid.length ? `<p style="margin:0 0 6px;font-weight:bold;color:#16a34a">Paid (${usd(total)})</p><ul style="margin:0 0 16px;padding-left:20px;color:#1A3A5C;font-size:14px">${list(summary.paid)}</ul>` : ""}
      ${summary.failed.length ? `<p style="margin:0 0 6px;font-weight:bold;color:#B91C1C">Failed — please check</p><ul style="margin:0 0 16px;padding-left:20px;color:#1A3A5C;font-size:14px">${list(summary.failed)}</ul>` : ""}
      ${summary.skipped.length ? `<p style="margin:0 0 6px;font-weight:bold;color:#4A6B82">Skipped</p><ul style="margin:0 0 16px;padding-left:20px;color:#4A6B82;font-size:13px">${list(summary.skipped)}</ul>` : ""}
      ${primaryButton(`${APP_URL}/dashboard/admin/payouts`, "Open Payouts")}
    `),
  });
}

// ─── Account Emails ──────────────────────────────────────────────────────────

/** Sent when an admin creates an account. Never includes the password — the admin hands that over directly. */
export async function sendAccountCreatedEmail({
  to, name, roleLabel,
}: {
  to: string; name: string; roleLabel: string;
}) {
  return sendEmail({
    to,
    subject: `Your ${BRAND_NAME} account is ready`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Welcome, ${name}!</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">Our team has set up a ${BRAND_NAME} account for you.</p>
      ${detailTable([
        { label: "Login email", value: `<strong>${to}</strong>` },
        { label: "Account type", value: roleLabel },
        { label: "Password", value: "Your temporary password will be given to you by our team." },
      ])}
      <p style="color:#4A6B82;font-size:13px;margin:0 0 16px">When you log in for the first time, you'll be asked to choose your own password.</p>
      ${primaryButton(`${APP_URL}/login`, "Log in")}
    `),
  });
}

// ─── Store Partner Applications ──────────────────────────────────────────────

export async function sendPartnerApplicationAdminEmail({
  businessName, contactName, email, phone, address, storeType, locationsCount, hasScreen,
}: {
  businessName: string; contactName: string; email: string; phone: string; address: string;
  storeType: string; locationsCount: string; hasScreen: string;
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New store partner application: ${businessName}`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">New store partner application</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 20px">A store owner wants to host a Community Bulletin screen.</p>
      ${detailTable([
        { label: "Business", value: `<strong>${businessName}</strong>` },
        { label: "Contact", value: `${contactName} · ${phone} · ${email}` },
        { label: "Address", value: address },
        { label: "Store type", value: storeType },
        { label: "Locations", value: locationsCount },
        { label: "Has a TV", value: hasScreen },
      ])}
      ${primaryButton(`${APP_URL}/dashboard/admin/applications`, "Review application")}
    `),
  });
}

export async function sendPartnerApprovedEmail({ to, name, businessName }: { to: string; name: string; businessName: string }) {
  return sendEmail({
    to,
    subject: `Welcome aboard — ${businessName} is approved`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:20px">You're approved, ${name}!</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 16px">Your store partner application for <strong>${businessName}</strong> has been approved.</p>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 16px">Here's what happens next:</p>
      <ol style="color:#4A6B82;font-size:14px;margin:0 0 20px;padding-left:20px;line-height:1.7">
        <li>We'll contact you to schedule setup of your screen.</li>
        <li>We'll send your store partner agreement to review and sign.</li>
        <li>Add your payout details on your Earnings page so we can pay you each month.</li>
      </ol>
      ${primaryButton(`${APP_URL}/dashboard/store-owner`, "Go to your dashboard")}
    `),
  });
}

export async function sendPartnerDeclinedEmail({ to, name, businessName, reason }: { to: string; name: string; businessName: string; reason: string | null }) {
  return sendEmail({
    to,
    subject: `Your store partner application for ${businessName}`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:${BRAND_COLOR};font-size:20px">Thanks for your interest, ${name}</h2>
      <p style="color:#4A6B82;font-size:14px;margin:0 0 16px">We're not able to move forward with <strong>${businessName}</strong> as a store partner at this time.</p>
      ${reason ? `<div style="background:#F7F9FC;border-left:4px solid ${ACCENT_COLOR};padding:12px 16px;margin:0 0 16px;border-radius:0 8px 8px 0"><p style="margin:0;font-size:13px;color:#1A3A5C">${reason}</p></div>` : ""}
      <p style="color:#4A6B82;font-size:13px">Your account stays active, and you're welcome to advertise on Community Bulletin or reach out again in the future.</p>
      ${primaryButton(`${APP_URL}/contact`, "Contact us")}
    `),
  });
}
