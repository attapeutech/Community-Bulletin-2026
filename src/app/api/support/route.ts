import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, ADMIN_EMAIL, FROM_EMAIL } from "@/lib/email";
import { verifyRecaptcha } from "@/lib/recaptcha";

const schema = z.object({
  name:            z.string().min(2,  "Name must be at least 2 characters"),
  email:           z.string().email("Enter a valid email address"),
  subject:         z.string().min(1,  "Please select a subject"),
  message:         z.string().min(10, "Message must be at least 10 characters"),
  recaptchaToken:  z.string().min(1,  "reCAPTCHA verification required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 422 });
    }

    const { name, email, subject, message, recaptchaToken } = parsed.data;

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) {
      return NextResponse.json({ success: false, error: "reCAPTCHA verification failed. Please try again." }, { status: 422 });
    }

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Support] ${subject} — from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1A3A5C;margin-bottom:4px">New Support Request</h2>
          <p style="color:#6B8FA8;font-size:13px;margin-top:0">CommunityBulletin.com Help Center</p>
          <hr style="border:none;border-top:1px solid #E2EAF2;margin:20px 0"/>
          <table style="width:100%;font-size:14px;color:#1A3A5C">
            <tr><td style="padding:6px 0;font-weight:600;width:100px">Name</td><td>${name}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Email</td><td><a href="mailto:${email}" style="color:#4A90C4">${email}</a></td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Subject</td><td>${subject}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #E2EAF2;margin:20px 0"/>
          <p style="font-weight:600;color:#1A3A5C;margin-bottom:8px">Message</p>
          <p style="color:#374151;line-height:1.6;white-space:pre-wrap">${message}</p>
          <hr style="border:none;border-top:1px solid #E2EAF2;margin:20px 0"/>
          <p style="font-size:12px;color:#9CA3AF">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
      text: `New Support Request\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    // Auto-reply to the user
    await sendEmail({
      to: email,
      subject: "We received your message — CommunityBulletin.com Support",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1A3A5C">Thanks for reaching out, ${name}!</h2>
          <p style="color:#374151;line-height:1.6">We've received your support request and will get back to you within <strong>1–2 business days</strong>.</p>
          <div style="background:#F4F7FB;border-radius:10px;padding:16px 20px;margin:20px 0">
            <p style="margin:0 0 6px;font-weight:600;color:#1A3A5C">Your message</p>
            <p style="margin:0;color:#6B8FA8;font-size:13px;white-space:pre-wrap">${message}</p>
          </div>
          <p style="color:#374151;line-height:1.6">If your issue is urgent, you can reply directly to this email.</p>
          <p style="color:#6B8FA8;font-size:13px;margin-top:24px">— The CommunityBulletin.com Team</p>
        </div>
      `,
      text: `Thanks for reaching out, ${name}!\n\nWe've received your message and will get back to you within 1–2 business days.\n\nYour message:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[POST /api/support]", e);
    return NextResponse.json({ success: false, error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
