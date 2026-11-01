"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { CalendarPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { APPOINTMENT_TYPES, googleCalendarUrl, localDay, type Appointment } from "@/lib/appointments";

export type LeadOption = { id: string; label: string; place: string | null };

/** What the form opens with: a new appointment (maybe for a day or a lead), or an existing one */
export type AppointmentDraft =
  | { kind: "new"; date: string; leadId?: string }
  | { kind: "edit"; appointment: Appointment };

const fieldLabel = "block mb-1.5 text-[11px] font-semibold text-[#4A6B82] uppercase tracking-[0.04em]";
const selectClass = "h-10 w-full rounded-md border border-[#D8E4EE] bg-white px-2.5 text-sm text-[#1A3A5C]";

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
/** "14:30" plus minutes, kept within the day */
function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const t = Math.min(h * 60 + m + mins, 23 * 60 + 59);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Add or change an appointment. `leads` lists the leads to choose from; a fixed `lead` hides the picker. */
export default function AppointmentDialog({ draft, onClose, leads, lead }: {
  draft: AppointmentDraft | null;
  onClose: () => void;
  leads?: LeadOption[];
  lead?: LeadOption;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [type, setType] = useState("visit");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");
  const editing = draft?.kind === "edit" ? draft.appointment : null;

  // Fill the form each time it opens
  useEffect(() => {
    if (!draft) return;
    if (draft.kind === "edit") {
      const a = draft.appointment;
      const s = new Date(a.startsAt), e = new Date(a.endsAt);
      setLeadId(a.leadId); setType(a.type); setDate(localDay(s)); setStart(hhmm(s)); setEnd(hhmm(e));
      setPlace(a.place ?? ""); setNotes(a.notes ?? "");
    } else {
      const id = lead?.id ?? draft.leadId ?? "";
      setLeadId(id); setType("visit"); setDate(draft.date); setStart("10:00"); setEnd("11:00");
      setPlace((lead ?? leads?.find(l => l.id === id))?.place ?? ""); setNotes("");
    }
  }, [draft, lead, leads]);

  function chooseLead(id: string) {
    setLeadId(id);
    // Suggest the lead's address as the place, unless one was typed
    const p = leads?.find(l => l.id === id)?.place;
    if (p && !place) setPlace(p);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId) { toast.error("Choose a lead"); return; }
    // The date and times are the browser's local time; the server stores the exact moment
    const startsAt = new Date(`${date}T${start}`);
    const endsAt = new Date(`${date}T${end}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) { toast.error("Pick a date and times"); return; }
    if (endsAt <= startsAt) { toast.error("The end time must be after the start"); return; }
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/admin/appointments/${editing.id}` : "/api/admin/appointments", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, type, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), place, notes }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error ?? "Couldn't save the appointment");
      toast.success(editing ? "Appointment saved" : "Appointment added");
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing || !window.confirm("Delete this appointment?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/appointments/${editing.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!json?.success) { toast.error(json?.error ?? "Couldn't delete"); return; }
    toast.success("Appointment deleted");
    onClose();
    router.refresh();
  }

  return (
    <Dialog.Root open={!!draft} onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-[480px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-xl bg-white text-[#1A3A5C] shadow-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <Dialog.Title className="font-serif text-[20px] font-bold">{editing ? "Appointment" : "New appointment"}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="text-[#4A6B82] hover:text-[#1A3A5C]"><X size={18} /></Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Schedule a visit, call, demo or meeting with a lead.</Dialog.Description>

          <form onSubmit={save} className="flex flex-col gap-4">
            <div>
              <Label className={fieldLabel}>Lead</Label>
              {lead ? (
                <div className="text-[14px] font-semibold">{lead.label}</div>
              ) : (
                <select value={leadId} onChange={e => chooseLead(e.target.value)} className={selectClass} required>
                  <option value="">Choose a lead…</option>
                  {(leads ?? []).map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              )}
            </div>

            <div>
              <Label className={fieldLabel}>Type</Label>
              <div className="flex gap-2 flex-wrap">
                {APPOINTMENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn("h-8 px-3 rounded-full border text-[13px] font-semibold", type === t.value ? t.chip : "bg-white text-[#4A6B82] border-[#D8E4EE]")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <Label className={fieldLabel}>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="h-10 bg-white" />
              </div>
              <div>
                <Label className={fieldLabel}>From</Label>
                <Input
                  type="time"
                  value={start}
                  onChange={e => {
                    // Keep the same length when the start moves
                    const v = e.target.value;
                    if (!v) return;
                    const [sh, sm] = start.split(":").map(Number), [eh, em] = end.split(":").map(Number);
                    const len = Math.max(15, eh * 60 + em - (sh * 60 + sm));
                    setStart(v); setEnd(addMinutes(v, len));
                  }}
                  required
                  className="h-10 bg-white w-[118px]"
                />
              </div>
              <div>
                <Label className={fieldLabel}>To</Label>
                <Input type="time" value={end} onChange={e => setEnd(e.target.value)} required className="h-10 bg-white w-[118px]" />
              </div>
            </div>

            <div>
              <Label className={fieldLabel}>Place</Label>
              <Input value={place} onChange={e => setPlace(e.target.value)} placeholder="Address, or phone / video call" className="h-10 bg-white" />
            </div>

            <div>
              <Label className={fieldLabel}>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="What to bring, what to cover" className="bg-white" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button type="submit" disabled={busy} className="h-10 px-4 rounded-md bg-[#1A3A5C] text-white text-[14px] font-semibold disabled:opacity-50">
                {busy ? "Saving…" : editing ? "Save" : "Add appointment"}
              </button>
              {editing && (
                <a
                  href={googleCalendarUrl(editing)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md border border-[#D8E4EE] text-[13px] text-[#1A3A5C] no-underline hover:bg-[#F0F5FA]"
                >
                  <CalendarPlus size={15} /> Add to Google Calendar
                </a>
              )}
              {editing && (
                <button type="button" disabled={busy} onClick={remove} className="ml-auto text-[12px] text-red-700 hover:underline disabled:opacity-50">
                  Delete
                </button>
              )}
            </div>
            {editing && <div className="text-[11px] text-[#4A6B82] -mt-2">Google Calendar opens in the sales account with this appointment filled in; click Save there.</div>}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
