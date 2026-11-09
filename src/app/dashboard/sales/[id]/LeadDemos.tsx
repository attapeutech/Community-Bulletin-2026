"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, MessageSquare, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { demoPath } from "@/lib/demos";
import { PROPOSAL_STATUS, proposalPath, proposalStatus, proposalTextMessage, smsHref } from "@/lib/proposals";

export type LeadDemo = {
  id: string;
  token: string;
  locationId: string;
  storeLabel: string;
  storeSlug: string;
  expiresAt: string;
  ads: { id: string; title: string; imageUrl: string }[];
  proposals: { id: string; token: string; email: string; sentAt: string; viewedAt: string | null; acceptedAt: string | null; paidAt: string | null }[];
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Advertiser lead: demo ads shown to them on their store's real screen, through a private link */
export default function LeadDemos({ leadId, locationId, storeLabel, demos, contact }: {
  leadId: string;
  contact: { businessName: string; contactName: string | null; phone: string | null };   // for texting a proposal
  locationId: string | null;   // the lead's store now
  storeLabel: string | null;
  demos: LeadDemo[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const hasDemoHere = demos.some(d => d.locationId === locationId);

  async function call(url: string, method: string, body?: object) {
    setBusy(true);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error ?? "Something went wrong");
      router.refresh();
      return json;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    const json = await call("/api/admin/demos", "POST", { leadId });
    // Straight on to the first demo ad
    if (json) router.push(`/ads/new?demo=${json.data.id}`);
  }

  async function copyLink(d: LeadDemo) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${demoPath(d.storeSlug, d.token)}`);
      toast.success("Demo link copied");
    } catch {
      toast.error("Couldn't copy. Open the demo and copy the address instead.");
    }
  }

  // Proposals: the same private pay link, by text or pasted anywhere
  const proposalUrl = (token: string) => `${window.location.origin}${proposalPath(token)}`;
  const textProposal = (token: string, d: LeadDemo) => {
    window.location.href = smsHref(contact.phone, proposalTextMessage({ contactName: contact.contactName, businessName: contact.businessName, storeName: d.storeLabel, url: proposalUrl(token) }));
  };
  async function copyProposal(token: string) {
    try {
      await navigator.clipboard.writeText(proposalUrl(token));
      toast.success("Pay link copied");
    } catch {
      toast.error("Couldn't copy. Open it with View and copy the address instead.");
    }
  }

  return (
    <Card id="demos" className="rounded-xl border-[#D8E4EE] scroll-mt-24">
      <CardHeader className="px-5 py-4 border-b border-[#D8E4EE]">
        <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">Ad demos</CardTitle>
        <p className="text-[12px] text-[#4A6B82] m-0 mt-1">
          Make sample ads for this business and show them on the store&apos;s real screen design, on their own. Only people with the link can see it; the store TV never shows them. Links work for 30 days.
        </p>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-4">
        {demos.map(d => {
          const expired = new Date(d.expiresAt) < new Date();
          return (
            <div key={d.id} className="rounded-lg border border-[#D8E4EE] p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold text-[14px] text-[#1A3A5C]">{d.storeLabel}</div>
                  <div className={cn("text-[12px]", expired ? "text-red-700 font-semibold" : "text-[#4A6B82]")}>
                    {expired ? `Link expired ${fmtDate(d.expiresAt)}` : `Link works until ${fmtDate(d.expiresAt)}`} · {d.ads.length} demo ad{d.ads.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!expired && (
                    <>
                      <a
                        href={demoPath(d.storeSlug, d.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1A3A5C] text-white text-[12px] font-semibold no-underline"
                      >
                        <ExternalLink size={13} /> Show demo
                      </a>
                      <button type="button" onClick={() => copyLink(d)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#D8E4EE] bg-white text-[12px] text-[#1A3A5C] hover:bg-[#F0F5FA]">
                        <Copy size={13} /> Copy link
                      </button>
                      {d.ads.length > 0 && (
                        <Link
                          href={`/dashboard/sales/${leadId}/proposal?demo=${d.id}`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#E8563A] text-white text-[12px] font-semibold no-underline"
                        >
                          <Send size={13} /> Send proposal
                        </Link>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => call(`/api/admin/demos/${d.id}`, "PATCH", { extend: true }).then(j => j && toast.success("Link extended 30 days"))}
                    className="h-8 px-3 rounded-md border border-[#D8E4EE] bg-white text-[12px] text-[#1A3A5C] hover:bg-[#F0F5FA] disabled:opacity-50"
                  >
                    {expired ? "Turn back on (30 days)" : "Extend 30 days"}
                  </button>
                </div>
              </div>

              {d.ads.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {d.ads.map(ad => (
                    <div key={ad.id} className="rounded-md border border-[#D8E4EE] overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ad.imageUrl} alt="" className="w-full aspect-video object-cover bg-[#EEF4F9]" />
                      <div className="px-2.5 py-2 flex items-start justify-between gap-2">
                        <span className="text-[12px] text-[#1A3A5C] leading-snug line-clamp-2">{ad.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                        {!expired && (
                          <Link href={`/ads/new?demo=${d.id}&edit=${ad.id}`} aria-label={`Edit demo ad ${ad.title}`} className="text-[#4A6B82] hover:text-[#1A3A5C]">
                            <Pencil size={14} />
                          </Link>
                        )}
                        <button
                          type="button"
                          aria-label={`Delete demo ad ${ad.title}`}
                          disabled={busy}
                          onClick={() => window.confirm("Delete this demo ad?") && call(`/api/ads/${ad.id}`, "DELETE")}
                          className="text-[#4A6B82] hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Proposals sent from this demo, newest first */}
              {d.proposals.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4A6B82]">Proposals</div>
                  {d.proposals.map(p => {
                    const st = PROPOSAL_STATUS[proposalStatus(p, d.expiresAt)];
                    return (
                      <div key={p.id} className="flex items-center gap-2 flex-wrap text-[12px] text-[#1A3A5C]">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5", st.chip)}>{st.label}</span>
                        <span className="truncate">{p.email} · sent {fmtDate(p.sentAt)}{p.viewedAt ? ` · opened ${fmtDate(p.viewedAt)}` : ""}{p.paidAt ? ` · paid ${fmtDate(p.paidAt)}` : ""}</span>
                        <span className="ml-auto flex items-center gap-3">
                          {!p.paidAt && !expired && (
                            <>
                              <button type="button" onClick={() => textProposal(p.token, d)} className="inline-flex items-center gap-1 text-[#4A90C4] hover:underline p-0 bg-transparent border-0 cursor-pointer text-[12px]">
                                <MessageSquare size={12} /> Text
                              </button>
                              <button type="button" onClick={() => copyProposal(p.token)} className="inline-flex items-center gap-1 text-[#4A90C4] hover:underline p-0 bg-transparent border-0 cursor-pointer text-[12px]">
                                <Copy size={12} /> Copy link
                              </button>
                            </>
                          )}
                          <a href={proposalPath(p.token)} target="_blank" rel="noopener noreferrer" className="text-[#4A90C4] no-underline hover:underline">View</a>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap">
                {!expired ? (
                  <Link href={`/ads/new?demo=${d.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#4A90C4] no-underline hover:underline">
                    <Plus size={14} /> Add a demo ad
                  </Link>
                ) : <span />}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => window.confirm("Delete this demo and its demo ads? The link stops working.") && call(`/api/admin/demos/${d.id}`, "DELETE")}
                  className="text-[12px] text-red-700 hover:underline disabled:opacity-50"
                >
                  Delete demo
                </button>
              </div>
            </div>
          );
        })}

        {!locationId ? (
          <div className="text-[13px] text-[#4A6B82]">Choose the store they&apos;d advertise at (on the right) to make a demo.</div>
        ) : !hasDemoHere && (
          <div>
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#E8563A] text-white text-[13px] font-semibold disabled:opacity-50"
            >
              <Plus size={15} /> Make a demo at {storeLabel ?? "their store"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
