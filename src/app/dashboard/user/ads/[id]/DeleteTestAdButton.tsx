"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Test ads have no payment or history worth keeping, so an admin can simply delete them
export default function DeleteTestAdButton({ adId }: { adId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this test ad?")) return;
    setBusy(true);
    const res = await fetch(`/api/ads/${adId}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    if (json?.success) {
      router.push("/dashboard/user");
      router.refresh();
    } else {
      setBusy(false);
      window.alert(json?.error ?? "Couldn't delete the test ad.");
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      style={{
        border: "1px solid #fca5a5", color: "#991b1b", background: "#fee2e2",
        padding: "9px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? "Deleting…" : "Delete test ad"}
    </button>
  );
}
