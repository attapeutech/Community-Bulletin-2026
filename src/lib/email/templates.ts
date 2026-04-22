import { sendEmail, APPROVER_EMAIL, ADMIN_EMAIL, APP_URL } from "./index";

// ─── Auth Emails ────────────────────────────────────────────────────────────

export async function sendVerificationEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}) {
  return sendEmail({
    to,
    subject: "Verify your AdBoard email",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Welcome to AdBoard, ${name}!</h2>
        <p>Please verify your email address to get started.</p>
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#6b7280;font-size:14px;margin-top:24px">
          This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}) {
  return sendEmail({
    to,
    subject: "Reset your AdBoard password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Password Reset Request</h2>
        <p>Hi ${name}, we received a request to reset your password.</p>
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:14px;margin-top:24px">
          This link expires in 1 hour. If you did not request a password reset, please ignore this email.
        </p>
      </div>
    `,
  });
}

// ─── Ad Status Emails ────────────────────────────────────────────────────────

export async function send2FACodeEmail({
  to,
  name,
  code,
}: {
  to: string;
  name: string;
  code: string;
}) {
  return sendEmail({
    to,
    subject: "Your login verification code",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Your verification code</h2>
        <p>Hi ${name}, use the code below to complete your sign-in.</p>
        <div style="background:#f1f5f9;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:0.3em;color:#1A3A5C">${code}</span>
        </div>
        <p style="color:#6b7280;font-size:14px">This code expires in 10 minutes. If you did not attempt to sign in, please change your password immediately.</p>
      </div>
    `,
  });
}


  to,
  userName,
  adTitle,
  locationName,
  adId,
}: {
  to: string;
  userName: string;
  adTitle: string;
  locationName: string;
  adId: string;
}) {
  return sendEmail({
    to,
    cc: [APPROVER_EMAIL, ADMIN_EMAIL],
    subject: `Ad submitted for review – "${adTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Your ad has been submitted!</h2>
        <p>Hi ${userName}, your ad <strong>"${adTitle}"</strong> for <strong>${locationName}</strong> has been submitted and is now <span style="background:#fef9c3;padding:2px 8px;border-radius:4px;font-weight:600">Pending Review</span>.</p>
        <p>Our team will review it within 1–2 business days. You'll receive an email as soon as a decision is made.</p>
        <table style="border-collapse:collapse;width:100%;margin:24px 0;font-size:14px">
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #e5e7eb">Ad title</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${adTitle}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #e5e7eb">Location</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${locationName}</td></tr>
          <tr><td style="padding:8px;color:#6b7280">Status</td><td style="padding:8px">Pending</td></tr>
        </table>
        <a href="${APP_URL}/dashboard/user/ads/${adId}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          View Your Ad
        </a>
      </div>
    `,
  });
}

export async function sendAdApprovedEmail({
  to,
  userName,
  adTitle,
  locationName,
  locationSlug,
  adId,
  startedAt,
  endedAt,
}: {
  to: string;
  userName: string;
  adTitle: string;
  locationName: string;
  locationSlug: string;
  adId: string;
  startedAt: string;
  endedAt: string;
}) {
  const displayUrl = `${APP_URL}/display/${locationSlug}`;
  return sendEmail({
    to,
    subject: `Your ad has been approved – "${adTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#16a34a">Your ad is approved!</h2>
        <p>Hi ${userName}, great news! Your ad <strong>"${adTitle}"</strong> has been <span style="background:#dcfce7;padding:2px 8px;border-radius:4px;font-weight:600;color:#16a34a">Approved</span> and is now live.</p>
        <p>Thank you for advertising with AdBoard. Your ad will display at <strong>${locationName}</strong> for the full 30-day period.</p>
        <table style="border-collapse:collapse;width:100%;margin:24px 0;font-size:14px">
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #e5e7eb">Ad title</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${adTitle}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #e5e7eb">Location</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${locationName}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;border-bottom:1px solid #e5e7eb">Starts</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${startedAt}</td></tr>
          <tr><td style="padding:8px;color:#6b7280">Ends</td><td style="padding:8px">${endedAt}</td></tr>
        </table>
        <a href="${displayUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:12px">
          View Live Display
        </a>
        <a href="${APP_URL}/dashboard/user/ads/${adId}" style="display:inline-block;background:#e5e7eb;color:#111;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          View Ad Details
        </a>
      </div>
    `,
  });
}

export async function sendAdDeniedEmail({
  to,
  userName,
  adTitle,
  reviewNote,
  adId,
}: {
  to: string;
  userName: string;
  adTitle: string;
  reviewNote: string;
  adId: string;
}) {
  return sendEmail({
    to,
    subject: `Ad update – "${adTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Ad review update</h2>
        <p>Hi ${userName}, after review your ad <strong>"${adTitle}"</strong> was not approved at this time.</p>
        <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:20px 0;border-radius:0 6px 6px 0">
          <p style="margin:0;font-size:14px;color:#b91c1c"><strong>Reviewer note:</strong> ${reviewNote}</p>
        </div>
        <p>A full refund of <strong>$100.00</strong> has been initiated to your original payment method and should appear within 5–10 business days.</p>
        <p>You are welcome to submit a revised ad at any time.</p>
        <a href="${APP_URL}/ads/new" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Submit a New Ad
        </a>
      </div>
    `,
  });
}
