"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useSession } from "@/lib/auth/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";

const SUBJECTS = [
  "General Question",
  "Billing / Payment",
  "Ad Submission",
  "Technical Issue",
  "Store Owner Inquiry",
  "Report a Problem",
  "Other",
];

const schema = z.object({
  name:    z.string().min(2,  "Name must be at least 2 characters"),
  email:   z.string().email("Enter a valid email address"),
  subject: z.string().min(1,  "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

function ContactForm({ defaultEmail }: { defaultEmail?: string }) {
  const [sent, setSent] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: defaultEmail ?? "", subject: "", message: "" },
  });

  const onSubmit = useCallback(async (data: FormData) => {
    if (!executeRecaptcha) {
      toast.error("reCAPTCHA not ready. Please try again.");
      return;
    }
    try {
      const recaptchaToken = await executeRecaptcha("contact_form");
      const res  = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, recaptchaToken }) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? "Failed to send. Please try again."); return; }
      setSent(true);
    } catch { toast.error("Something went wrong. Please try again."); }
  }, [executeRecaptcha]);

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-[#1A3A5C] mb-2">Message sent!</h3>
        <p className="text-sm text-[#6B8FA8] max-w-sm">We'll get back to you within 1–2 business days. Check your inbox for a confirmation email.</p>
        <Button variant="ghost" onClick={() => { setSent(false); reset({ email: defaultEmail ?? "" }); }} className="mt-6 text-[#4A90C4]">
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Your name *</Label>
          <Input {...register("name")} placeholder="Jane Smith" className={`h-10 bg-[#F7F9FC] border-[#D1DDE8] text-sm ${errors.name ? "border-red-400 bg-red-50" : ""}`} />
          <FieldError msg={errors.name?.message} />
        </div>
        <div>
          <Label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Email address *</Label>
          <Input type="email" {...register("email")} placeholder="you@example.com" className={`h-10 bg-[#F7F9FC] border-[#D1DDE8] text-sm ${errors.email ? "border-red-400 bg-red-50" : ""}`} />
          <FieldError msg={errors.email?.message} />
        </div>
      </div>
      <div>
        <Label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Subject *</Label>
        <select
          {...register("subject")}
          className={`w-full h-10 rounded-md border px-3 text-sm text-[#1A3A5C] focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 ${errors.subject ? "border-red-400 bg-red-50" : "border-[#D1DDE8] bg-[#F7F9FC]"}`}
        >
          <option value="">Select a subject…</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <FieldError msg={errors.subject?.message} />
      </div>
      <div>
        <Label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Message *</Label>
        <Textarea
          {...register("message")}
          placeholder="Describe your issue or question in detail…"
          rows={6}
          className={`text-sm resize-none ${errors.message ? "border-red-400 bg-red-50" : "bg-[#F7F9FC] border-[#D1DDE8]"}`}
        />
        <FieldError msg={errors.message?.message} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-[#1A3A5C] hover:bg-[#0F2540] text-white">
        {isSubmitting ? "Sending…" : "Send message"}
        {!isSubmitting && <ArrowRight size={16} className="ml-2" />}
      </Button>
    </form>
  );
}

function ContactPageContent() {
  const { data: session } = useSession();
  return (
    <PublicLayout>

      {/* ── Hero ── */}
      <section className="pt-14 pb-14 px-4 sm:px-8 bg-gradient-to-br from-[#1A3A5C] via-[#0F2540] to-[#1A3A5C] text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
          <MessageSquare size={14} className="text-[#9DC4E0]" />
          <span className="text-xs font-semibold text-[#9DC4E0] uppercase tracking-wide">Contact Us</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-white mb-4">Get in touch</h1>
        <p className="text-[#9DC4E0] text-base max-w-xl mx-auto leading-relaxed">
          Have a question or need help? Send us a message and we'll get back to you soon.
        </p>
      </section>


      {/* ── Contact form ── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-8 mb-20">
        <div className="bg-white rounded-2xl border border-[#E2EAF2] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E8EFF6] flex items-center gap-3">
            <MessageSquare size={20} className="text-[#4A90C4]" />
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A3A5C]">Send us a message</h2>
              <p className="text-xs text-[#6B8FA8]">We read every message and reply as quickly as we can.</p>
            </div>
          </div>
          <div className="px-6 py-6">
            <ContactForm defaultEmail={session?.user?.email} />
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}

export default function ContactPage() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
      <ContactPageContent />
    </GoogleReCaptchaProvider>
  );
}
