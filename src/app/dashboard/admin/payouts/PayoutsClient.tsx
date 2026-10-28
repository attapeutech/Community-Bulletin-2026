"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MIN_PAYOUT_CENTS } from "@/types";
import type { RunSummary } from "@/lib/direct-deposits";

export type OwnerBalance = {
  id: string;
  name: string;
  email: string;
  payoutMethod: string | null;
  payoutZelle: string | null;
  payoutMailingAddress: string | null;
  agreementStatus: string | null;   // null = not tracked; payouts held while not_sent / sent
  agreementSignedAt: Date | string | null;
  stripeAccountId: string | null;
  stripePayoutsEnabled: boolean;
  manualPayoutAllowed: boolean;     // admin-approved Zelle/check exception
  availableCents: number;
  availableCount: number;
  pendingCents: number;
  pendingCount: number;
};

export type PayoutRow = {
  id: string;
  ownerName: string;
  amountCents: number;
  method: "zelle" | "check" | "stripe";
  reference: string | null;
  note: string | null;
  paidAt: string;
};

type DirectDepositsInfo = { testMode: boolean; lastRun: RunSummary | null } | null;

const METHOD_LABEL = { zelle: "Zelle", check: "Check", stripe: "Direct deposit" } as const;

function DirectDepositBadge({ o }: { o: OwnerBalance }) {
  const [label, cls] = o.manualPayoutAllowed
    ? ["Zelle/check exception", "bg-slate-100 text-slate-700 border-slate-200"]
    : o.stripePayoutsEnabled
      ? ["Direct deposit active", "bg-green-50 text-green-800 border-green-200"]
      : o.stripeAccountId
        ? ["Direct deposit setup incomplete", "bg-amber-50 text-amber-800 border-amber-200"]
        : ["Direct deposit not set up", "bg-amber-50 text-amber-800 border-amber-200"];
  return <span className={cn("inline-block text-[10px] font-semibold border rounded-full px-2 py-0.5", cls)}>{label}</span>;
}

function ManualExceptionToggle({ o }: { o: OwnerBalance }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/direct-deposits/owner/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualPayoutAllowed: !o.manualPayoutAllowed }),
      });
      if ((await res.json()).success) router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={toggle} disabled={busy} className="text-[11px] text-[#4A90C4] hover:underline bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50">
      {o.manualPayoutAllowed ? "Switch back to direct deposit" : "Allow Zelle/check instead"}
    </button>
  );
}

const AGREEMENT = [
  { value: "not_sent", label: "Not sent" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
] as const;

/** Partner agreement status for any store owner (Applications has the same control, but only for owners who applied) */
function AgreementControl({ o }: { o: OwnerBalance }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function set(status: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/direct-deposits/owner/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementStatus: status }),
      });
      if ((await res.json()).success) router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
      <span className="font-semibold text-[#1A3A5C]">Agreement:</span>
      {AGREEMENT.map(a => (
        <button
          key={a.value}
          type="button"
          disabled={busy || o.agreementStatus === a.value}
          onClick={() => set(a.value)}
          className={cn(
            "px-2.5 py-0.5 rounded-full border",
            o.agreementStatus === a.value
              ? "bg-[#1A3A5C] border-[#1A3A5C] text-white font-semibold"
              : "bg-white border-[#D8E4EE] text-[#4A6B82] hover:border-[#1A3A5C] cursor-pointer disabled:opacity-50"
          )}
        >
          {a.label}
        </button>
      ))}
      {o.agreementStatus === "signed" && o.agreementSignedAt && (
        <span className="text-green-800">signed {new Date(o.agreementSignedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
      )}
      {o.agreementStatus === null && <span className="text-[#4A6B82]">not tracked</span>}
    </div>
  );
}

function DirectDepositsCard({ info }: { info: NonNullable<DirectDepositsInfo> }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = info.lastRun;

  async function runNow() {
    if (!confirm("Pay every eligible store owner their available balance now by direct deposit?")) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/direct-deposits/run", { method: "POST" });
      const json = await res.json();
      if (!json.success) setError(json.error ?? "Run failed");
      router.refresh();
    } catch {
      setError("Run failed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  const paidTotal = run?.paid.reduce((s, p) => s + p.amountCents, 0) ?? 0;
  return (
    <Card className="rounded-xl border-[#D8E4EE] overflow-hidden mb-6">
      <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="font-serif text-[18px] text-[#1A3A5C] flex items-center gap-2 flex-wrap">
              Direct Deposits
              {info.testMode && <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">Stripe test mode</span>}
            </CardTitle>
            <p className="text-xs text-[#4A6B82] mt-1">
              Automatic on the 15th of each month: every owner with direct deposit active and at least {money(MIN_PAYOUT_CENTS)} available is paid their full balance. Each owner is paid at most once a month.
            </p>
          </div>
          <Button onClick={runNow} disabled={running} className="bg-[#1A3A5C] hover:bg-[#15304d] text-white text-[13px] h-9">
            {running ? "Running…" : "Run direct deposits now"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4 text-[13px] text-[#4A6B82]">
        {error && <p className="text-red-700 m-0 mb-2">{error}</p>}
        {!run ? (
          <p className="m-0">No runs yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div>
              <strong className="text-[#1A3A5C]">Last run:</strong> {new Date(run.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              {" · "}{run.trigger === "manual" ? "started by an admin" : "automatic"}
              {" · "}<span className="text-green-800 font-semibold">{run.paid.length} paid ({money(paidTotal)})</span>
              {run.failed.length > 0 && <span className="text-red-700 font-semibold"> · {run.failed.length} failed</span>}
              {run.skipped.length > 0 && <> · {run.skipped.length} skipped</>}
            </div>
            {(run.failed.length > 0 || run.skipped.length > 0) && (
              <ul className="m-0 pl-5 flex flex-col gap-1 text-[12px]">
                {run.failed.map(l => <li key={`f-${l.ownerId}`} className="text-red-700">{l.name} ({money(l.amountCents)}): {l.reason}</li>)}
                {run.skipped.map(l => <li key={`s-${l.ownerId}`}>{l.name} ({money(l.amountCents)}): {l.reason}</li>)}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function PayoutDetails({ o }: { o: OwnerBalance }) {
  if (o.payoutMethod === "zelle" && o.payoutZelle) {
    return <span>Zelle: <strong className="text-[#1A3A5C]">{o.payoutZelle}</strong></span>;
  }
  if (o.payoutMethod === "check" && o.payoutMailingAddress) {
    return <span className="whitespace-pre-line">Check to: <strong className="text-[#1A3A5C]">{o.payoutMailingAddress}</strong></span>;
  }
  return <span className="text-amber-700 font-semibold">No payout details yet; ask the owner to add them on their Earnings page.</span>;
}

function MarkPaidForm({ o, onDone }: { o: OwnerBalance; onDone: () => void }) {
  const router = useRouter();
  const [method, setMethod] = useState<"zelle" | "check">(o.payoutMethod === "check" ? "check" : "zelle");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: o.id, method, reference, note, expectedCents: o.availableCents }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not record payout.");
        return;
      }
      onDone();
      router.refresh();
    } catch {
      setError("Could not record payout. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-[#D8E4EE] bg-[#F7F9FC] p-4 flex flex-col gap-3">
      <p className="text-[13px] text-[#4A6B82] m-0">
        Send <strong className="text-[#1A3A5C]">{money(o.availableCents)}</strong> to {o.name} first, then record it here.
        The owner gets an email confirmation.
      </p>
      <div className="flex gap-2 flex-wrap">
        {(["zelle", "check"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={cn(
              "px-3.5 py-1.5 rounded-full border text-xs",
              method === m
                ? "bg-[#1A3A5C] border-[#1A3A5C] text-white font-semibold"
                : "bg-white border-[#D8E4EE] text-[#4A6B82] hover:border-[#1A3A5C] cursor-pointer"
            )}
          >
            {m === "zelle" ? "Zelle" : "Check"}
          </button>
        ))}
      </div>
      <Input
        placeholder={method === "zelle" ? "Zelle confirmation number (optional)" : "Check number (optional)"}
        value={reference}
        onChange={e => setReference(e.target.value)}
        className="h-9 text-sm bg-white border-[#D8E4EE]"
      />
      <Input
        placeholder="Internal note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        className="h-9 text-sm bg-white border-[#D8E4EE]"
      />
      {error && <p className="text-[13px] text-red-700 m-0">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving} className="bg-green-800 hover:bg-green-900 text-white text-[13px] h-9">
          {saving ? "Recording…" : `Confirm ${money(o.availableCents)} paid`}
        </Button>
        <Button variant="outline" onClick={onDone} disabled={saving} className="text-[13px] h-9">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Plan for partner review — remove or update once Phase 2 ships
function DirectDepositPlanNotes() {
  const h = "text-[12px] font-bold text-[#1A3A5C] uppercase tracking-[0.05em] mt-5 mb-2";
  const ul = "m-0 pl-5 flex flex-col gap-1.5";
  return (
    <details className="mb-6 rounded-xl border border-[#D8E4EE] bg-[#F7F9FC] px-5 py-4 text-[13px] text-[#4A6B82] leading-relaxed">
      <summary className="cursor-pointer font-bold text-[14px] text-[#1A3A5C] flex items-center gap-2 flex-wrap">
        <span>Planned: automatic direct deposits for store owners (Phase 2)</span>
        <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">Not live yet · for review</span>
      </summary>

      <p className="mt-3 mb-0">
        Today we pay store owners by hand each month (Zelle or check). Phase 2 has Stripe pay them automatically by direct deposit,
        using the same earnings records we already keep.
      </p>

      <div className={h}>For store owners</div>
      <ul className={ul}>
        <li>One-time setup from their Earnings page: <strong>&ldquo;Get paid by direct deposit&rdquo;</strong> opens Stripe&apos;s secure signup, where they enter their identity, bank account and tax details (W-9).</li>
        <li>We never see or store their bank details; Stripe holds them.</li>
        <li>Their page shows the status (<em>Not set up</em>, <em>Incomplete</em> or <em>Active</em>) and a link to view their payouts on Stripe.</li>
        <li>Owners with money waiting but no direct deposit get reminders to finish setup.</li>
      </ul>

      <div className={h}>Automatic monthly payouts</div>
      <ul className={ul}>
        <li>On the <strong>15th of each month</strong>, every owner with direct deposit set up and at least <strong>$25</strong> available is paid their full balance.</li>
        <li>Each owner gets an email and an in-app notification when their payout is sent.</li>
        <li>Each owner can be paid only once per month, so nobody is ever paid twice.</li>
        <li>Owners who haven&apos;t finished setup are skipped; their balance waits for the next run.</li>
        <li>If our Stripe balance is ever short, the remaining payouts wait until next month.</li>
        <li>Admins get a summary email after each run: who was paid, how much, and who was skipped and why.</li>
      </ul>

      <div className={h}>Admin controls (this page)</div>
      <ul className={ul}>
        <li>Each owner&apos;s direct-deposit status.</li>
        <li>A <strong>&ldquo;Run direct deposits now&rdquo;</strong> button to pay early, plus the date and totals of the last run.</li>
        <li>Zelle or check stays available only as an exception an admin approves for a specific owner.</li>
      </ul>

      <div className={h}>Taxes: no payroll needed</div>
      <ul className={ul}>
        <li>Store owners are independent businesses, not employees: no payroll, no tax withholding. Each owner handles their own taxes.</li>
        <li>The one remaining duty, sending the yearly 1099 tax information forms, is handled by Stripe: it collects W-9s, files the forms, and delivers copies to owners. We review and approve once a year.</li>
        <li>Owners paid by Zelle or check fall outside this, which is why direct deposit is the standard. To be confirmed with our accountant.</li>
      </ul>

      <div className={h}>Costs</div>
      <ul className={ul}>
        <li>Stripe charges a small fee per connected owner and per payout. <strong>We cover it</strong>, so owners receive exactly what their Earnings page shows.</li>
        <li>If we want to offset it later, we can adjust each store&apos;s revenue share, which admins already control, rather than deducting from payouts.</li>
      </ul>

      <div className={h}>Before it goes live</div>
      <ul className={ul}>
        <li>Turn on Stripe Connect in our Stripe account, with our platform profile and 1099 tax reporting.</li>
        <li>Build and test everything in Stripe test mode first.</li>
        <li>Update the store owner agreement (sections 6.4 and 6.6) to say payouts are by direct deposit through Stripe, and that each owner handles their own taxes.</li>
      </ul>
    </details>
  );
}

export default function PayoutsClient({ balances, history, directDeposits }: { balances: OwnerBalance[]; history: PayoutRow[]; directDeposits: DirectDepositsInfo }) {
  const [openOwner, setOpenOwner] = useState<string | null>(null);

  const totalOwed = balances.reduce((s, o) => s + o.availableCents, 0);
  const dueCount = balances.filter(o => o.availableCents >= MIN_PAYOUT_CENTS).length;

  return (
    <div className="w-full">
      <div className="mb-7 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Store Owner Payouts</h1>
          <p className="text-[#4A6B82] text-sm">
            {money(totalOwed)} available across {dueCount} owner{dueCount !== 1 ? "s" : ""} at or above the {money(MIN_PAYOUT_CENTS)} minimum.
          </p>
        </div>
        <Link href="/dashboard/store-owner/earnings" className="text-[13px] text-[#4A90C4] no-underline hover:underline">
          View all earnings →
        </Link>
      </div>

      {directDeposits ? <DirectDepositsCard info={directDeposits} /> : <DirectDepositPlanNotes />}

      <Card className="rounded-xl border-[#D8E4EE] overflow-hidden mb-6">
        <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
          <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">Balances</CardTitle>
          <p className="text-xs text-[#4A6B82] mt-1">Pay monthly. Balances under {money(MIN_PAYOUT_CENTS)} roll over to next month.</p>
        </CardHeader>
        <CardContent className="p-0">
          {balances.length === 0 ? (
            <div className="py-8 text-center text-[#4A6B82] text-sm">No store owners yet.</div>
          ) : (
            <div className="divide-y divide-[#D8E4EE]">
              {balances.map(o => {
                const belowMin = o.availableCents < MIN_PAYOUT_CENTS;
                const agreementPending = o.agreementStatus === "not_sent" || o.agreementStatus === "sent";
                // With direct deposits on, owners whose direct deposit is active are paid automatically
                const paidAutomatically = !!directDeposits && o.stripePayoutsEnabled && !o.manualPayoutAllowed;
                return (
                  <div key={o.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-semibold text-[14px] text-[#1A3A5C]">{o.name}</div>
                        <div className="text-[12px] text-[#4A6B82]">{o.email}</div>
                        {directDeposits && (
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            <DirectDepositBadge o={o} />
                            <ManualExceptionToggle o={o} />
                          </div>
                        )}
                        {!paidAutomatically && <div className="text-[12px] text-[#4A6B82] mt-1.5"><PayoutDetails o={o} /></div>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn("text-[18px] font-bold", belowMin ? "text-[#4A6B82]" : "text-green-800")}>
                          {money(o.availableCents)}
                        </div>
                        <div className="text-[11px] text-[#4A6B82]">
                          available · {o.availableCount} ad run{o.availableCount !== 1 ? "s" : ""}
                        </div>
                        {o.pendingCount > 0 && (
                          <div className="text-[11px] text-amber-700">
                            + ≈ {money(o.pendingCents)} pending ({o.pendingCount})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2"><AgreementControl o={o} /></div>
                    {agreementPending && (
                      <div className="mt-2 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 inline-block">
                        Agreement {o.agreementStatus === "sent" ? "sent, awaiting signature" : "not sent yet"} — payouts are held until it&apos;s marked Signed.
                      </div>
                    )}
                    {o.availableCents > 0 && openOwner !== o.id && !agreementPending && !paidAutomatically && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenOwner(o.id)}
                          className="h-7 px-3 text-[11px] font-semibold border-green-300 text-green-800 bg-green-50 hover:bg-green-100"
                        >
                          Mark paid
                        </Button>
                        {belowMin && <span className="text-[11px] text-[#4A6B82]">Below the {money(MIN_PAYOUT_CENTS)} minimum; normally rolls over.</span>}
                      </div>
                    )}
                    {openOwner === o.id && <MarkPaidForm o={o} onDone={() => setOpenOwner(null)} />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
          <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="py-8 text-center text-[#4A6B82] text-sm">No payouts recorded yet.</div>
          ) : (
            <div className="divide-y divide-[#D8E4EE]">
              {history.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-[14px] font-semibold text-[#1A3A5C]">{p.ownerName}</div>
                    <div className="text-[12px] text-[#4A6B82]">
                      {new Date(p.paidAt).toLocaleDateString("en-US", { dateStyle: "medium" })} · {METHOD_LABEL[p.method]}
                      {p.reference && ` · ref ${p.reference}`}
                      {p.note && ` · ${p.note}`}
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-green-800">{money(p.amountCents)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
