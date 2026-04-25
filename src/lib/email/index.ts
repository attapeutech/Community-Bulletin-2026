import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!;
export const APPROVER_EMAIL = process.env.RESEND_APPROVER_EMAIL!;
export const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL!;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if (error) {
      console.error("[EMAIL ERROR]", error);
      return { success: false, error };
    }
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("[EMAIL ERROR]", error);
    return { success: false, error };
  }
}
