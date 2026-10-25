"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HAS_SCREEN, LOCATION_COUNTS, STORE_TYPES, labelFor } from "@/lib/partner-application-schema";

export type ApplicationRow = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  storeType: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  locationsCount: string;
  hasScreen: string;
  notes: string | null;
  status: "pending" | "approved" | "declined";
  declineReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  locationId: string | null;
  locationName: string | null;
  userEmail: string;
  userName: string;
  emailVerified: boolean;
  agreementStatus: string | null;
  agreementSignedAt: string | null;
};

const STATUS_BADGE: Record<ApplicationRow["status"], string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  declined: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
};

const AGREEMENT = [
  { value: "not_sent", label: "Not sent" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });

async function patch(id: string, body: object) {
  const res = await fetch(`/api/admin/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!json?.success) throw new Error(json?.error ?? "Something went wrong");
}

function ApplicationCard({ a }: { a: ApplicationRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  async function run(body: object, done: string) {
    setBusy(true);
    try {
      await patch(a.id, body);
      toast.success(done);
      setDeclining(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const agreementPending = a.status === "approved" && a.agreementStatus !== "signed";

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[15px] text-[#1A3A5C]">{a.businessName}</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5", STATUS_BADGE[a.status])}>{a.status}</span>
            {a.status === "pending" && !a.emailVerified && (
              <span className="text-[10px] font-semibold text-[#4A6B82] border border-[#D8E4EE] rounded-full px-2 py-0.5">email not confirmed yet</span>
            )}
          </div>
          <div className="text-[12px] text-[#4A6B82] mt-0.5">
            Applied {fmtDate(a.createdAt)}{a.reviewedAt && ` · reviewed ${fmtDate(a.reviewedAt)}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
        <Detail label="Contact">{a.contactName} · <a href={`tel:${a.phone}`} className="text-[#4A90C4]">{a.phone}</a></Detail>
        <Detail label="Email"><a href={`mailto:${a.userEmail}`} className="text-[#4A90C4] break-all">{a.userEmail}</a></Detail>
        <Detail label="Address">{a.addressLine1}, {a.city}, {a.state} {a.postalCode}</Detail>
        <Detail label="Store type">{labelFor(STORE_TYPES, a.storeType)}</Detail>
        <Detail label="Locations">{labelFor(LOCATION_COUNTS, a.locationsCount)}</Detail>
        <Detail label="Has a TV">{labelFor(HAS_SCREEN, a.hasScreen)}</Detail>
        {a.notes && <div className="sm:col-span-2"><Detail label="Notes">{a.notes}</Detail></div>}
        {a.status === "declined" && a.declineReason && <div className="sm:col-span-2"><Detail label="Decline reason">{a.declineReason}</Detail></div>}
      </div>

      {/* Pending: approve / decline */}
      {a.status === "pending" && !declining && (
        <div className="flex gap-2 flex-wrap">
          <Button disabled={busy} onClick={() => run({ action: "approve" }, `${a.businessName} approved`)} className="h-8 text-[12px] bg-green-800 hover:bg-green-900 text-white">
            Approve
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setDeclining(true)} className="h-8 text-[12px]">
            Decline
          </Button>
        </div>
      )}
      {a.status === "pending" && declining && (
        <div className="flex flex-col gap-2 rounded-lg border border-[#D8E4EE] bg-[#F7F9FC] p-3">
          <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason shown to the applicant (optional)" className="h-9 text-sm bg-white" />
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => run({ action: "decline", reason }, "Application declined")} className="h-8 text-[12px] bg-[#1A3A5C] text-white">
              Confirm decline
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setDeclining(false)} className="h-8 text-[12px]">Cancel</Button>
          </div>
        </div>
      )}

      {/* Approved: set up the store + track the agreement */}
      {a.status === "approved" && (
        <div className="flex flex-col gap-2.5 rounded-lg border border-[#D8E4EE] bg-[#F7F9FC] p-3">
          <div className="flex items-center gap-2 flex-wrap text-[13px]">
            <span className="font-semibold text-[#1A3A5C]">Store:</span>
            {a.locationId ? (
              <Link href={`/dashboard/store-owner/locations/${a.locationId}`} className="text-[#4A90C4] font-semibold">{a.locationName ?? "View location"} ↗</Link>
            ) : (
              <Link href={`/dashboard/store-owner/locations/new?application=${a.id}`} className="inline-flex items-center h-7 px-3 rounded-md bg-[#1A3A5C] text-white text-[12px] font-semibold no-underline">
                Set up location →
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap text-[13px]">
            <span className="font-semibold text-[#1A3A5C]">Agreement:</span>
            {AGREEMENT.map(o => (
              <button
                key={o.value}
                disabled={busy}
                onClick={() => run({ action: "agreement", status: o.value }, `Agreement marked ${o.label.toLowerCase()}`)}
                className={cn(
                  "px-3 py-1 rounded-full border text-[12px]",
                  a.agreementStatus === o.value
                    ? "bg-[#1A3A5C] border-[#1A3A5C] text-white font-semibold"
                    : "bg-white border-[#D8E4EE] text-[#4A6B82] hover:border-[#1A3A5C] cursor-pointer"
                )}
              >
                {o.label}
              </button>
            ))}
            {a.agreementStatus === "signed" && a.agreementSignedAt && <span className="text-[12px] text-green-800">signed {fmtDate(a.agreementSignedAt)}</span>}
          </div>
          {agreementPending && <div className="text-[12px] text-amber-800">Payouts to this partner are held until the agreement is marked Signed.</div>}
        </div>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-[#1A3A5C]">
      <span className="text-[#4A6B82]">{label}: </span>
      {children}
    </div>
  );
}

export default function ApplicationsClient({ applications }: { applications: ApplicationRow[] }) {
  const [filter, setFilter] = useState<"all" | ApplicationRow["status"]>("all");
  const pending = applications.filter(a => a.status === "pending").length;
  const unsigned = applications.filter(a => a.status === "approved" && a.agreementStatus !== "signed").length;
  const shown = filter === "all" ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Store Partner Applications</h1>
        <p className="text-[#4A6B82] text-sm">
          {pending} pending review{unsigned > 0 && ` · ${unsigned} approved partner${unsigned !== 1 ? "s" : ""} without a signed agreement`}
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "pending", "approved", "declined"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-1.5 rounded-full border text-xs capitalize",
              filter === f ? "bg-[#1A3A5C] border-[#1A3A5C] text-white font-semibold" : "bg-white border-[#D8E4EE] text-[#4A6B82] hover:border-[#1A3A5C]"
            )}
          >
            {f}{f !== "all" && ` (${applications.filter(a => a.status === f).length})`}
          </button>
        ))}
      </div>

      <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
          <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {shown.length === 0 ? (
            <div className="py-10 text-center text-[#4A6B82] text-sm">No applications here yet.</div>
          ) : (
            <div className="divide-y divide-[#D8E4EE]">
              {shown.map(a => <ApplicationCard key={a.id} a={a} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
