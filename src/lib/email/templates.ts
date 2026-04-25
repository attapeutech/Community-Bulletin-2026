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
      <td style="padding:9px 12px;color:#6B8FA8;font-size:13px;border-bottom:1px solid #e2eaf2;white-space:nowrap">${r.label}</td>
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
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 24px">Please verify your email address to activate your account and start advertising in your community.</p>
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
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 24px">Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.</p>
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
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 24px">Hi ${name}, use the code below to complete your sign-in.</p>
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
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 20px">Hi ${userName}, your ad has been received and is now pending review. Our team will review it within 1–2 business days.</p>
      ${detailTable([
        { label: "Ad title", value: `<strong>${adTitle}</strong>` },
        { label: "Location", value: locationName },
        { label: "Status", value: '<span style="background:#fef9c3;color:#854d0e;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">Pending Review</span>' },
      ])}
      <p style="color:#6B8FA8;font-size:13px">You'll receive an email as soon as a decision is made.</p>
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
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 20px">A new ad has been submitted and is awaiting your review and approval.</p>
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
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 20px">Hi ${userName}, your payment has been received. Your ad has been submitted for review.</p>
      ${detailTable([
        { label: "Ad title", value: `<strong>${adTitle}</strong>` },
        { label: "Location", value: locationName },
        { label: "Amount paid", value: `<strong style="color:${CORAL_COLOR}">${amountFormatted}</strong>` },
        { label: "Payment method", value: provider.charAt(0).toUpperCase() + provider.slice(1) },
        { label: "Duration", value: "1 week" },
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
  const displayUrl = `${APP_URL}/display/${locationSlug}`;
  return sendEmail({
    to,
    subject: `Your ad is approved and live — "${adTitle}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:20px">Your ad is approved! 🎉</h2>
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 20px">Hi ${userName}, great news! Your ad is now live on the in-store display screen at <strong>${locationName}</strong>.</p>
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
      <p style="color:#6B8FA8;font-size:14px;margin:0 0 20px">Hi ${userName}, after review your ad <strong>"${adTitle}"</strong> was not approved at this time.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;margin:0 0 20px;border-radius:0 8px 8px 0">
        <p style="margin:0;font-size:13px;color:#b91c1c"><strong>Reviewer note:</strong> ${reviewNote}</p>
      </div>
      <p style="color:#6B8FA8;font-size:13px">${refundNote}</p>
      <p style="color:#6B8FA8;font-size:13px">You are welcome to submit a revised ad at any time.</p>
      ${primaryButton(`${APP_URL}/ads/new`, "Submit a New Ad")}
    `),
  });
}
