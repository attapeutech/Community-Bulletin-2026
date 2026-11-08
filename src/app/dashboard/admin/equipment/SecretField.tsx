"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * An encrypted value: dots until "Show" fetches it from `revealUrl`; "Change" lets you type a new one.
 * `value` is what to send on save: null = keep the saved one, "" = clear (or nothing saved), text = new value.
 */
export function SecretField({
  saved, revealUrl, value, onChange, placeholder, inputMode,
}: {
  saved: boolean;
  revealUrl: string | null;  // null while the item isn't saved yet
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  const [shown, setShown] = useState<string | null>(null);

  async function show() {
    if (shown !== null) { setShown(null); return; }
    if (!revealUrl) return;
    try {
      const res = await fetch(revealUrl, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShown(json.data.value);
    } catch (e: any) {
      toast.error(e.message || "Couldn't load it");
    }
  }

  async function copy() {
    if (shown === null) return;
    try { await navigator.clipboard.writeText(shown); toast.success("Copied"); } catch { toast.error("Couldn't copy"); }
  }

  if (saved && value === null) {
    return (
      <div className="flex items-center gap-1.5">
        <code className="flex-1 min-w-0 h-9 flex items-center px-2.5 rounded-md border border-[#D1DDE8] bg-[#F7F9FC] text-sm text-[#1A3A5C] truncate">
          {shown ?? "••••••••"}
        </code>
        <Button type="button" variant="outline" onClick={show} className="h-9 px-2.5" title={shown === null ? "Show" : "Hide"}>
          {shown === null ? <Eye size={15} /> : <EyeOff size={15} />}
        </Button>
        {shown !== null && (
          <Button type="button" variant="outline" onClick={copy} className="h-9 px-2.5" title="Copy"><Copy size={15} /></Button>
        )}
        <Button type="button" variant="outline" onClick={() => { setShown(null); onChange(""); }} className="h-9 px-2.5 text-xs">Change</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={200}
        autoComplete="off"
        spellCheck={false}
        inputMode={inputMode}
        placeholder={saved ? "New value (leave empty to remove)" : placeholder ?? "Not saved yet"}
      />
      {saved && (
        <Button type="button" variant="outline" onClick={() => onChange(null)} className="h-9 px-2.5 text-xs">Keep old</Button>
      )}
    </div>
  );
}
