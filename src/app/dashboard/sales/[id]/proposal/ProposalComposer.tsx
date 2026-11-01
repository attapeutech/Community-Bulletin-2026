"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { demoPath } from "@/lib/demos";

const fieldLabel = "block mb-1.5 text-[11px] font-semibold text-[#4A6B82] uppercase tracking-[0.04em]";

export default function ProposalComposer({ demoId, lead, store, demoToken, expired, expiresAt, price, demoAds, defaults }: {
  demoId: string;
  lead: { id: string; businessName: string; email: string };
  store: { name: string; slug: string };
  demoToken: string;
  expired: boolean;
  expiresAt: string;
  price: string;
  demoAds: { id: string; title: string; imageUrl: string }[];
  defaults: { subject: string; message: string };
}) {
  const router = useRouter();
  const [adId, setAdId] = useState(demoAds[0]?.id ?? "");
  const [email, setEmail] = useState(lead.email);
  const [subject, setSubject] = useState(defaults.subject);
  const [message, setMessage] = useState(defaults.message);
  const [busy, setBusy] = useState(false);
  const back = `/dashboard/sales/${lead.id}`;
  // The store's real screen design, playing only the chosen demo ad
  const previewSrc = adId ? `${demoPath(store.slug, demoToken)}&ad=${adId}&only=1` : null;

  async function send() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId, demoAdId: adId, email, subject, message }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error ?? "Couldn't send the proposal");
      toast.success(`Proposal sent to ${email}`);
      router.push(`${back}#demos`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[1200px]">
      <Link href={back} className="text-[13px] text-[#4A6B82] no-underline hover:underline">← {lead.businessName}</Link>
      <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mt-2 mb-1">Send a proposal</h1>
      <p className="text-[#4A6B82] text-sm mb-5">
        {lead.businessName} gets an email with a link to see this ad on the {store.name} screen, and to accept and pay ({price} for 4 weeks). Their link works until {new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, like the demo.
      </p>

      {expired ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 text-[14px]">This demo&apos;s link has expired. Turn it back on from the lead page first.</div>
      ) : demoAds.length === 0 ? (
        <div className="rounded-xl border border-[#D8E4EE] bg-white p-4 text-[14px] text-[#4A6B82]">This demo has no demo ads yet. Add one from the lead page first.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 items-start">
          {/* What they'll see */}
          <Card className="rounded-xl border-[#D8E4EE] lg:sticky lg:top-4">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82]">Their ad on the {store.name} screen</div>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#0A1A2E]">
                {previewSrc && <iframe key={previewSrc} src={previewSrc} title="Ad preview" className="absolute inset-0 w-full h-full border-0" />}
              </div>
              {demoAds.length > 1 && (
                <div>
                  <div className={fieldLabel}>Offer this ad</div>
                  <div className="grid grid-cols-3 gap-2">
                    {demoAds.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAdId(a.id)}
                        className={cn("rounded-md border overflow-hidden text-left bg-white", adId === a.id ? "border-[#E8563A] ring-2 ring-[#E8563A]" : "border-[#D8E4EE]")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.imageUrl} alt="" className="w-full aspect-video object-cover bg-[#EEF4F9]" />
                        <div className="px-2 py-1 text-[11px] text-[#1A3A5C] truncate">{a.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* The email */}
          <Card className="rounded-xl border-[#D8E4EE]">
            <CardContent className="p-5 flex flex-col gap-4">
              <div>
                <Label className={fieldLabel}>To</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="advertiser@business.com" className="h-10 bg-white" />
                {!lead.email && <div className="text-[12px] text-[#4A6B82] mt-1">This lead has no email yet. Add it here (it isn&apos;t saved to the lead).</div>}
              </div>
              <div>
                <Label className={fieldLabel}>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} className="h-10 bg-white" />
              </div>
              <div>
                <Label className={fieldLabel}>Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={12} className="bg-white text-[14px] leading-relaxed" />
                <div className="text-[12px] text-[#4A6B82] mt-1">
                  Below your message the email shows the ad, the store and the price, and a <b>See your ad &amp; accept</b> button. Replies go to sales@communitybulletin.com.
                </div>
              </div>
              <div>
                <button
                  type="button"
                  disabled={busy || !adId || !email.trim() || !subject.trim() || !message.trim()}
                  onClick={send}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-[#E8563A] text-white text-[14px] font-semibold disabled:opacity-50"
                >
                  <Send size={15} /> {busy ? "Sending…" : "Send proposal"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
