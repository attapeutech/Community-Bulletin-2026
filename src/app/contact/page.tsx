"use client";

import React, { useState } from "react";
import { useSession } from "@/lib/auth/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, ArrowRight, Mail, Clock } from "lucide-react";

const SUBJECTS = [
  "General Question",
  "Billing / Payment",
  "Ad Submission",
  "Technical Issue",
  "Store Owner Inquiry",
  "Report a Problem",
  "Other",
];

function ContactForm({ defaultEmail }: { defaultEmail?: string }) {
  const [form, setForm] = useState({ name: "", email: defaultEmail ?? "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function set(field: string, val: string) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      const res  = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? "Failed to send. Please try again."); return; }
      setSent(true);
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSending(false); }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-[#1A3A5C] mb-2">Message sent!</h3>
        <p className="text-sm text-[#6B8FA8] max-w-sm">We'll get back to you within 1–2 business days. Check your inbox for a confirmation email.</p>
        <Button variant="ghost" onClick={() => { setSent(false); setForm({ name: "", email: defaultEmail ?? "", subject: "", message: "" }); }} className="mt-6 text-[#4A90C4]">
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Your name *</label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" className="h-10 bg-[#F7F9FC] border-[#D1DDE8] text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Email address *</label>
          <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" className="h-10 bg-[#F7F9FC] border-[#D1DDE8] text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Subject *</label>
        <select
          value={form.subject}
          onChange={e => set("subject", e.target.value)}
          className="w-full h-10 rounded-md border border-[#D1DDE8] bg-[#F7F9FC] px-3 text-sm text-[#1A3A5C] focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20"
        >
          <option value="">Select a subject…</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em] mb-1.5">Message *</label>
        <Textarea
          value={form.message}
          onChange={e => set("message", e.target.value)}
          placeholder="Describe your issue or question in detail…"
          rows={6}
          className="bg-[#F7F9FC] border-[#D1DDE8] text-sm resize-none"
        />
      </div>
      <Button type="submit" disabled={sending} className="w-full h-11 bg-[#1A3A5C] hover:bg-[#0F2540] text-white">
        {sending ? "Sending…" : "Send message"}
        {!sending && <ArrowRight size={16} className="ml-2" />}
      </Button>
    </form>
  );
}

export default function ContactPage() {
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

      {/* ── Info cards ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 -mt-6 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[#E2EAF2] shadow-sm p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#4A90C4]/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-[#4A90C4]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1A3A5C] mb-0.5">Email us directly</div>
              <div className="text-[13px] text-[#6B8FA8]">support@communitybulletin.com</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2EAF2] shadow-sm p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-[#10B981]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1A3A5C] mb-0.5">Response time</div>
              <div className="text-[13px] text-[#6B8FA8]">Within 1–2 business days</div>
            </div>
          </div>
        </div>
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
