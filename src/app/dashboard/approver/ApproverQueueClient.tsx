"use client";

import { useState, useCallback, useEffect } from "react";
import { useDashboardSocket } from "@/lib/socket/client";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  contactPhone:   string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  showPhone:   boolean;
  showAddress: boolean;
  showWebsite: boolean;
  user: { id: string; name: string; email: string };
  location: { id: string; storeName: string; slug: string; addressLine1: string; addressLine2: string | null; cityName: string; stateCode: string; postalCode: string };
};

export default function ApproverQueueClient({ initialAds }: { initialAds: Ad[] }) {
  const [queue, setQueue] = useState<Ad[]>(initialAds);
  const [selected, setSelected] = useState<Ad | null>(null);
  const [mode, setMode] = useState<"approve" | "deny" | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);

  // Close preview on Escape
  useEffect(() => {
    if (!previewAd) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewAd(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewAd]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Live updates via Socket.io
  const onAdStatusChanged = useCallback(
    (payload: { adId: string; status: string }) => {
      if (payload.status !== "pending") {
        setQueue((prev) => prev.filter((a) => a.id !== payload.adId));
        if (selected?.id === payload.adId) {
          setSelected(null);
          setMode(null);
        }
      }
    },
    [selected]
  );
  useDashboardSocket(onAdStatusChanged);

  // Refresh queue from server (called after action)
  const refreshQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/ads/pending");
      const json = await res.json();
      if (json.success) setQueue(json.data);
    } catch { /* ignore */ }
  }, []);

  const handleApprove = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${selected.id}/approve`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`"${selected.title}" approved and live!`, true);
      setQueue((prev) => prev.filter((a) => a.id !== selected.id));
      setSelected(null);
      setMode(null);
    } catch (e: any) {
      showToast(e.message || "Approval failed", false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!selected || !reviewNote.trim()) return;
    if (reviewNote.trim().length < 10) {
      showToast("Review note must be at least 10 characters", false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${selected.id}/deny`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: reviewNote.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`"${selected.title}" denied. Refund initiated.`, true);
      setQueue((prev) => prev.filter((a) => a.id !== selected.id));
      setSelected(null);
      setMode(null);
      setReviewNote("");
    } catch (e: any) {
      showToast(e.message || "Denial failed", false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <Alert
          className={cn(
            "fixed top-6 right-6 z-[9999] w-auto max-w-[380px] shadow-lg border-0 text-white",
            toast.ok ? "bg-green-800" : "bg-red-800"
          )}
        >
          <AlertDescription className="text-white font-medium">{toast.msg}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-1.5">
        <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C]">
          Review Ads
        </h1>
        <div className="text-[13px] text-[#6B8FA8]">
          {queue.length} ad{queue.length !== 1 ? "s" : ""} awaiting review
        </div>
      </div>
      <p className="text-[#6B8FA8] text-sm mb-8">
        Ads are shown only after payment is confirmed. Review image, title, and content before approving.
      </p>

      {queue.length === 0 ? (
        <Card className="rounded-xl border-[#D8E4EE]">
          <CardContent className="py-12 text-center">
            <div className="text-[40px] mb-3">✅</div>
            <h2 className="font-serif text-[18px] text-[#1A3A5C] mb-2">All caught up!</h2>
            <p className="text-[#6B8FA8] text-sm">No ads are currently pending review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid gap-4 sm:gap-6", selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
          {/* Queue list */}
          <div className="flex flex-col gap-3">
            {queue.map((ad) => (
              <button
                key={ad.id}
                onClick={() => { setSelected(ad); setMode(null); setReviewNote(""); }}
                className={cn(
                  "w-full text-left flex gap-3.5 items-start p-4 rounded-xl border cursor-pointer transition-colors",
                  selected?.id === ad.id
                    ? "bg-blue-50 border-2 border-[#4A90C4]"
                    : "bg-white border border-[#D8E4EE] hover:border-[#4A90C4]"
                )}
              >
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-20 h-14 object-cover rounded-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1A3A5C] mb-0.5">{ad.title}</div>
                  <div className="text-xs text-[#6B8FA8]">{ad.location.storeName}</div>
                  <div className="text-[11px] text-[#9DC4E0] mt-1">
                    By {ad.user.name} · {new Date(ad.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="bg-white rounded-xl border border-[#D8E4EE] p-6 sticky top-6">
              {/* Ad preview */}
              <div
                className="relative cursor-pointer group mb-4"
                onClick={() => setPreviewAd(selected)}
              >
                <img
                  src={selected.imageUrl}
                  alt={selected.title}
                  className="w-full max-h-[220px] object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-semibold bg-black/60 px-3 py-1.5 rounded-full transition-opacity">
                    ⛶ Preview on display screen
                  </span>
                </div>
              </div>

              <h3 className="font-serif text-[18px] text-[#1A3A5C] mb-1">{selected.title}</h3>
              {selected.description && (
                <p className="text-[13px] text-[#6B8FA8] mb-3">{selected.description}</p>
              )}

              <Separator className="mb-4" />

              <div className="grid gap-1.5 text-xs mb-5">
                <div><span className="text-[#9DC4E0]">Location: </span>{selected.location.storeName}</div>
                <div><span className="text-[#9DC4E0]">Address: </span>{selected.location.addressLine1}{selected.location.addressLine2 ? `, ${selected.location.addressLine2}` : ""}, {selected.location.cityName}, {selected.location.stateCode} {selected.location.postalCode}</div>
                <div><span className="text-[#9DC4E0]">Submitted by: </span>{selected.user.name} ({selected.user.email})</div>
                <div>
                  <span className="text-[#9DC4E0]">Submitted: </span>
                  {new Date(selected.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
                </div>
              </div>

              {/* Quick-view display screen */}
              <a
                href={`/display/${selected.location.slug}`}
                target="_blank"
                className="text-xs text-[#4A90C4] no-underline inline-block mb-5"
              >
                Preview display screen ↗
              </a>

              {/* Action buttons */}
              {!mode && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 text-sm font-semibold"
                    onClick={() => setMode("approve")}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 text-sm font-semibold"
                    onClick={() => setMode("deny")}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Deny
                  </Button>
                </div>
              )}

              {/* Confirm approve */}
              {mode === "approve" && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <p className="text-[13px] text-green-800 mb-3">
                    This ad will go live immediately for 1 week. The advertiser will be notified.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 text-sm font-semibold"
                      onClick={handleApprove}
                      disabled={loading}
                    >
                      {loading ? "Approving…" : "Confirm Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-[#E8EFF6] text-[#1A3A5C] border-0 h-10 text-sm hover:bg-[#D8E4EE]"
                      onClick={() => setMode(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Deny form */}
              {mode === "deny" && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <label className="block text-[13px] font-semibold text-red-800 mb-1.5">
                    Reason for denial *
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Explain why the ad is not approved (visible to advertiser)…"
                    rows={3}
                    className="w-full px-3 py-2 border border-red-300 rounded-md text-[13px] resize-y mb-3 box-border bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 text-sm font-semibold disabled:opacity-70"
                      onClick={handleDeny}
                      disabled={loading || reviewNote.trim().length < 10}
                    >
                      {loading ? "Denying…" : "Confirm Deny & Refund"}
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-[#E8EFF6] text-[#1A3A5C] border-0 h-10 text-sm hover:bg-[#D8E4EE]"
                      onClick={() => { setMode(null); setReviewNote(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Display screen preview modal */}
      {previewAd && (() => {
        const hasSplit = !!(previewAd.contactPhone || previewAd.contactAddress || previewAd.contactWebsite);
        const len = previewAd.title.length;
        const titleSize = len <= 20 ? "clamp(28px, 4vw, 58px)" : len <= 40 ? "clamp(20px, 2.8vw, 42px)" : "clamp(15px, 2vw, 30px)";
        return (
          <div
            onClick={() => setPreviewAd(null)}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(90vw, 1100px)", height: "min(56vw, 620px)",
                background: "#0A1A2E", borderRadius: 12, overflow: "hidden",
                position: "relative", display: "flex",
                boxShadow: "0 0 0 8px #1a1a1a, 0 0 0 12px #333, 0 24px 48px rgba(0,0,0,0.8)",
              }}
            >
              {hasSplit ? (
                <>
                  <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(20px, 4vw, 52px)", position: "relative", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.15)" }}>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: titleSize, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: "clamp(10px, 1.5vw, 20px)" }}>{previewAd.title}</div>
                    {previewAd.description && <div style={{ fontSize: "clamp(11px, 1.2vw, 17px)", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: "clamp(12px, 1.8vw, 24px)" }}>{previewAd.description}</div>}
                    {(previewAd.showPhone || previewAd.showAddress || previewAd.showWebsite) && (
                      <>
                        <div style={{ width: 40, height: 3, background: "#E8563A", borderRadius: 2, marginBottom: "clamp(8px, 1.2vw, 16px)" }} />
                        <div style={{ fontSize: "clamp(9px, 0.8vw, 11px)", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "clamp(8px, 1vw, 14px)" }}>Contact Info</div>
                      </>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 14px)" }}>
                      {previewAd.showPhone   && previewAd.contactPhone   && <div style={{ fontSize: "clamp(12px, 1.3vw, 18px)", color: "#fff",     fontWeight: 600 }}>📞 {previewAd.contactPhone}</div>}
                      {previewAd.showAddress && previewAd.contactAddress && <div style={{ fontSize: "clamp(12px, 1.3vw, 18px)", color: "#fff",     fontWeight: 600 }}>📍 {previewAd.contactAddress}</div>}
                      {previewAd.showWebsite && previewAd.contactWebsite && <div style={{ fontSize: "clamp(12px, 1.3vw, 18px)", color: "#4A90C4", fontWeight: 600 }}>🌐 {previewAd.contactWebsite}</div>}
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <img src={previewAd.imageUrl} alt={previewAd.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ position: "absolute", bottom: 12, right: 20, fontSize: "clamp(10px, 0.9vw, 13px)", color: "rgba(255,255,255,0.35)" }}>
                    Ad #{previewAd.id.slice(-6).toUpperCase()}
                  </div>
                </>
              ) : (
                <>
                  <img src={previewAd.imageUrl} alt={previewAd.title} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 18%)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "clamp(11px, 1.4vw, 18px)", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{previewAd.location.storeName}</span>
                    <span style={{ fontSize: "clamp(10px, 1.2vw, 15px)", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", marginLeft: 24 }}>Ad #{previewAd.id.slice(-6).toUpperCase()}</span>
                  </div>
                </>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 20 }}>
              This is how the ad will appear on the display screen · Click anywhere or press Esc to close
            </p>
          </div>
        );
      })()}
    </div>
  );
}
