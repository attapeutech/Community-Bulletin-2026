"use client";

import { useState } from "react";
import { Copy, Check, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type IssuedCredential = {
  name: string;
  email: string;
  tempPassword: string;
  expiresInDays: number;
  isNewAccount: boolean;
};

const ROLE_OPTIONS = [
  { value: "store_owner", label: "Store Owner" },
  { value: "user",        label: "Advertiser (User)" },
  { value: "approver",    label: "Approver" },
  { value: "admin",       label: "Admin" },
];

/** "+ Add user" button and form. Calls onCreated with the new user and their one-time temporary password. */
export function AddUserPanel({
  onCreated,
}: {
  onCreated: (user: any, credential: IssuedCredential) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("store_owner");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(""); setEmail(""); setRole("store_owner"); setSendWelcomeEmail(true); setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, sendWelcomeEmail }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not create the account.");
        return;
      }
      onCreated(json.data.user, {
        name: json.data.user.name,
        email: json.data.user.email,
        tempPassword: json.data.tempPassword,
        expiresInDays: json.data.expiresInDays,
        isNewAccount: true,
      });
      reset();
      setOpen(false);
    } catch {
      setError("Could not create the account. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="h-[30px] px-3 text-xs font-semibold bg-[#1A3A5C] hover:bg-[#15304d] text-white"
      >
        <UserPlus size={13} className="mr-1.5" />
        Add user
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-xl border border-[#D8E4EE] bg-white p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-serif font-bold text-[15px] text-[#1A3A5C]">Add a user</span>
        <button type="button" onClick={() => { reset(); setOpen(false); }} className="text-[#4A6B82] hover:text-[#1A3A5C]" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <p className="text-xs text-[#4A6B82] m-0">
        We&apos;ll create the account with a temporary password for you to hand over. They choose their own password when they first log in.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm border-[#D8E4EE]" />
        <Input placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9 text-sm border-[#D8E4EE]" />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-9 text-sm border-[#D8E4EE] text-[#1A3A5C]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[#1A3A5C] cursor-pointer">
        <input type="checkbox" checked={sendWelcomeEmail} onChange={e => setSendWelcomeEmail(e.target.checked)} className="w-4 h-4 accent-[#1A3A5C]" />
        Email them a welcome message with the login link (the password is never emailed)
      </label>
      {error && <p className="text-[13px] text-red-700 m-0">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="h-9 text-[13px] bg-green-800 hover:bg-green-900 text-white">
          {saving ? "Creating…" : "Create account"}
        </Button>
        <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={saving} className="h-9 text-[13px]">
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Shows a temporary password once, with a copy button. */
export function TempPasswordNotice({ credential, onDismiss }: { credential: IssuedCredential; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Login: ${credential.email}\nTemporary password: ${credential.tempPassword}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the password is still visible to copy by hand
    }
  }

  return (
    <div className="w-full rounded-xl border-2 border-green-300 bg-green-50 p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[14px] text-green-900">
            {credential.isNewAccount ? `Account created for ${credential.name}` : `New temporary password for ${credential.name}`}
          </div>
          <div className="text-xs text-green-900/80 mt-0.5">
            Give these to them directly. This password is shown only once and expires in {credential.expiresInDays} days if unused.
          </div>
        </div>
        <button onClick={onDismiss} className="text-green-900/70 hover:text-green-900 shrink-0" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
      <div className="rounded-lg bg-white border border-green-200 px-3 py-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
        <span className="text-[#4A6B82]">Login</span>
        <span className="font-semibold text-[#1A3A5C] break-all">{credential.email}</span>
        <span className="text-[#4A6B82]">Temporary password</span>
        <span className="font-mono font-bold text-[15px] text-[#1A3A5C] tracking-wide break-all">{credential.tempPassword}</span>
      </div>
      <div>
        <Button
          onClick={copy}
          variant="outline"
          className={cn("h-8 text-xs font-semibold", copied ? "border-green-400 text-green-800 bg-white" : "border-green-300 text-green-900 bg-white hover:bg-green-100")}
        >
          {copied ? <Check size={13} className="mr-1.5" /> : <Copy size={13} className="mr-1.5" />}
          {copied ? "Copied" : "Copy login details"}
        </Button>
      </div>
    </div>
  );
}
