"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LOCAL_AD_RADIUS_MILES } from "@/types";
import { SaleTemplate } from "@/components/display/templates/SaleTemplate";
import { EMPTY_SALE, SALE_LIMITS, saleTemplateSchema, saleTitle, type SaleTemplateData } from "@/lib/ad-templates";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";
import { costPerThousandCents, formatCostPerThousand, formatShoppers } from "@/lib/traffic";

// ─── Types ───────────────────────────────────────────────────────────────────
type Location = {
  id: string;
  storeName: string;
  storeNumber?: string | null;
  pricePerRunCents: number;
  dailyCustomers?: number | null;
  slug: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: { name: string };
  state: { code: string };
  postalCode: { code: string };
};

type Step = 1 | 2 | 3 | 4;

/** "~500 shoppers a day · $28.57 per 1,000 shoppers" (store-reported traffic) */
function ShopperReach({ loc }: { loc: Location }) {
  const cpm = costPerThousandCents(loc.pricePerRunCents, loc.dailyCustomers);
  return (
    <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600, marginTop: 3 }}>
      ~{formatShoppers(loc.dailyCustomers!)} shoppers a day
      {cpm !== null && <span style={{ color: "#4A6B82", fontWeight: 400 }}> · {formatCostPerThousand(cpm)} per 1,000 shoppers</span>}
    </div>
  );
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function StoreNumber({ value }: { value: string }) {
  return (
    <span style={{ color: "#E8563A", fontWeight: 600, marginLeft: 6 }}>
      · Store #{value.replace(/^#/, "")}
    </span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ACCENT = "#1A3A5C";
const RED = "#E8563A";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: ACCENT, marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 14px",
        border: "1px solid #D8E4EE",
        borderRadius: 8,
        fontSize: 14,
        color: "#1A3A5C",
        background: "#fff",
        outline: "none",
        boxSizing: "border-box",
        ...props.style,
      }}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", userSelect: "none" }}>
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? ACCENT : "#D8E4EE",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: checked ? 16 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ fontSize: 12, color: checked ? ACCENT : "#4A6B82", fontWeight: checked ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={4}
      style={{
        width: "100%",
        padding: "10px 14px",
        border: "1px solid #D8E4EE",
        borderRadius: 8,
        fontSize: 14,
        color: "#1A3A5C",
        background: "#fff",
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        ...props.style,
      }}
    />
  );
}

function Btn({
  children,
  onClick,
  disabled,
  secondary,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 24px",
        borderRadius: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 14,
        fontWeight: 600,
        background: secondary ? "#E8EFF6" : ACCENT,
        color: secondary ? ACCENT : "#fff",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
// The image is added on the Details step, so there's no separate image step
const STEPS: { label: string; step: Step }[] = [
  { label: "Location", step: 1 }, { label: "Details & image", step: 2 }, { label: "Review", step: 4 },
];

function StepBar({ current }: { current: Step }) {
  const steps = STEPS;
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
      {steps.map(({ label, step }, i) => {
        const num = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={label} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? "#16a34a" : active ? ACCENT : "#D8E4EE",
                color: done || active ? "#fff" : "#4A6B82",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
              }}>
                {done ? "✓" : num}
              </div>
              <div style={{ fontSize: 11, marginTop: 4, color: active ? ACCENT : "#4A6B82", fontWeight: active ? 600 : 400 }}>
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "#16a34a" : "#D8E4EE", marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const IMAGE_ACCEPT = { "image/jpeg": [], "image/png": [], "image/webp": [] };
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Wraps the screen preview so it doubles as the image upload: click to browse or drop an image on it.
 * Each preview has its own dropzone (the desktop panel and the phone preview are both mounted).
 */
function PreviewDropTarget({ onDrop, onDropRejected, hasImage, uploading, failed, children }: {
  onDrop: (files: File[]) => void;
  onDropRejected: (rejections: FileRejection[]) => void;
  hasImage: boolean;
  uploading: boolean;
  failed: boolean;
  children: React.ReactNode;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, onDropRejected, accept: IMAGE_ACCEPT, maxFiles: 1, maxSize: MAX_IMAGE_BYTES });
  const [hover, setHover] = useState(false);
  const pill: React.CSSProperties = {
    position: "absolute", left: "50%", transform: "translateX(-50%)", zIndex: 6, pointerEvents: "none",
    background: "rgba(10,26,46,0.85)", color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
    padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(4px)",
  };
  return (
    <div
      {...getRootProps({
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          position: "relative", cursor: "pointer", borderRadius: 10,
          outline: isDragActive ? "3px dashed #E8563A" : "none", outlineOffset: 3,
        },
      })}
      aria-label={hasImage ? "Click or drop an image to replace it" : "Click to upload or drag and drop your image"}
    >
      <input {...getInputProps()} />
      {children}
      {isDragActive ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 7, borderRadius: 10, background: "rgba(232,86,58,0.25)", display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <span style={{ ...pill, position: "static", transform: "none", background: "#E8563A", border: "none" }}>Drop to upload</span>
        </div>
      ) : uploading ? (
        <span style={{ ...pill, bottom: 14 }}>Uploading…</span>
      ) : failed ? (
        <span style={{ ...pill, bottom: 14, background: "rgba(153,27,27,0.9)" }}>Upload failed. Click to try another image</span>
      ) : !hasImage ? (
        <span style={{ ...pill, top: "50%", marginTop: -18, background: "#1A3A5C" }}>⬆ Click to upload or drag &amp; drop your image here</span>
      ) : hover ? (
        <span style={{ ...pill, bottom: 14 }}>Click or drop to replace the image</span>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NewAdPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Close preview on Escape
  useEffect(() => {
    if (!showPreview) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowPreview(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPreview]);

  // Form state
  const [locations, setLocations] = useState<Location[]>([]);   // search results
  const [allLocations, setAllLocations] = useState<Location[] | null>(null); // every active store, shown before searching
  const [locSearch, setLocSearch] = useState("");
  const [localConfirmed, setLocalConfirmed] = useState(false); // "my business is near this store", required before paying
  const [isAdmin, setIsAdmin] = useState(false);
  const [asTest, setAsTest] = useState(false); // admin: post as a test ad (no payment, preview screens only)
  const [demo, setDemo] = useState<{ id: string; name: string; leadId: string } | null>(null); // ?demo=<id>: a sales demo ad
  const [locLoading, setLocLoading] = useState(false);
  const [locSearched, setLocSearched] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Ad design: the built-in Sale template (default) or the advertiser's own image
  const [design, setDesign] = useState<"template" | "own">("template");
  const [sale, setSale] = useState<SaleTemplateData>(EMPTY_SALE);
  const setSaleField = (k: keyof SaleTemplateData, v: string) => setSale(prev => ({ ...prev, [k]: v }));
  // The live preview follows the fields a moment after typing stops, so the animation isn't restarted per keystroke
  const [previewSale, setPreviewSale] = useState<SaleTemplateData>(EMPTY_SALE);
  useEffect(() => { const t = setTimeout(() => setPreviewSale(sale), 600); return () => clearTimeout(t); }, [sale]);
  const [replay, setReplay] = useState(0);
  const isTemplate = design === "template";
  const adTitle = isTemplate ? saleTitle(sale) : title;

  // Contact info
  const [contactPhone,   setContactPhone]   = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactWebsite, setContactWebsite] = useState("");
  const [showPhone,   setShowPhone]   = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);

  // Pre-fill contact info from user profile (not on a demo ad: that's the prospect's business, not the admin's)
  useEffect(() => {
    const forDemo = new URLSearchParams(window.location.search).has("demo");
    fetch("/api/users/me")
      .then(r => r.json())
      .then(j => {
        if (j.success && !forDemo) {
          if (j.data.phone)   setContactPhone(j.data.phone);
          if (j.data.address) setContactAddress(j.data.address);
          if (j.data.website) setContactWebsite(j.data.website);
        }
        if (j.success) setIsAdmin(j.data.role === "admin");
      })
      .catch(() => {});
  }, []);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adding an ad to a sales demo (from an advertiser lead in Sales): the store is the demo's, so start at the
  // details step, filled in from the lead
  useEffect(() => {
    const demoId = new URLSearchParams(window.location.search).get("demo");
    if (!demoId) return;
    (async () => {
      const dj = await fetch(`/api/admin/demos/${encodeURIComponent(demoId)}`).then(r => r.json()).catch(() => null);
      if (!dj?.success) { setError(dj?.error ?? "Couldn't load the demo."); return; }
      const lj = await fetch(`/api/locations?slug=${encodeURIComponent(dj.data.locationSlug)}`).then(r => r.json()).catch(() => null);
      const loc = lj?.success ? lj.data?.[0] : null;
      if (!loc) { setError("The demo's store isn't available."); return; }
      const d = dj.data;
      setDemo({ id: d.id, name: d.businessName, leadId: d.leadId });
      setSaleField("businessName", d.businessName.slice(0, SALE_LIMITS.businessName));
      setTitle(d.businessName.slice(0, 120));
      if (d.phone) { setContactPhone(d.phone); setShowPhone(true); }
      const address = [d.address, d.city].filter(Boolean).join(", ");
      if (address) { setContactAddress(address); setShowAddress(true); }
      setSelectedLocation(loc);
      setAsTest(true);
      setStep(2);
    })();
  }, []);

  // ── Step 1: Location search ─────────────────────────────────────────────────
  // Arriving from a display screen's "Advertise here" QR code: ?location=<store slug> pre-selects the store
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("location");
    if (!slug) return;
    fetch(`/api/locations?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(json => {
        const loc = json.success ? json.data?.[0] : null;
        if (loc) setSelectedLocation(loc);
      })
      .catch(() => {});
  }, []);

  // Show every active store up front, so advertisers can pick without knowing what to search for
  useEffect(() => {
    fetch("/api/locations")
      .then(r => r.json())
      .then(json => {
        if (json.success) setAllLocations([...json.data].sort((a: Location, b: Location) => a.storeName.localeCompare(b.storeName)));
        else setAllLocations([]);
      })
      .catch(() => setAllLocations([]));
  }, []);

  const handleLocSearch = (val: string) => {
    setLocSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.trim().length < 2) { setLocations([]); setLocSearched(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setLocLoading(true);
      setLocSearched(false);
      try {
        const res = await fetch(`/api/locations?search=${encodeURIComponent(val.trim())}`);
        const json = await res.json();
        if (json.success) setLocations(json.data);
      } catch { /* ignore */ } finally {
        setLocLoading(false);
        setLocSearched(true);
      }
    }, 350);
  };

  // A search (2+ letters) narrows the list; otherwise every store is shown
  const searching = locSearch.trim().length >= 2;
  const shownLocations = searching ? locations : allLocations ?? [];

  // ── Step 3: Image upload via R2 presigned URL ───────────────────────────────
  // Uploads as soon as an image is chosen. Each upload gets a number, so if another image is
  // picked mid-upload, the older upload's late result is ignored.
  const uploadSeq = useRef(0);

  const uploadImage = useCallback(async (file: File) => {
    const seq = ++uploadSeq.current;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ads");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      if (seq !== uploadSeq.current) return;
      setUploadedImageUrl(json.data.publicUrl);
      setUploadedImageKey(json.data.key);
    } catch (e: any) {
      if (seq === uploadSeq.current) setError(e.message || "Image upload failed");
    } finally {
      if (seq === uploadSeq.current) setUploading(false);
    }
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    const file = accepted[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl(null);
    setUploadedImageKey(null);
    uploadImage(file);
  }, [uploadImage]);

  // Wrong type or over 10 MB: say why instead of silently ignoring the file
  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const code = rejections[0]?.errors[0]?.code;
    setError(code === "file-too-large" ? "That image is over 10 MB. Please choose a smaller one."
      : code === "file-invalid-type" ? "Please choose a JPEG, PNG or WebP image."
      : "That file can't be used. Please choose a JPEG, PNG or WebP image under 10 MB.");
  }, []);

  // ── Step 4: Submit ad ───────────────────────────────────────────────────────
  const submitAd = async () => {
    if (!selectedLocation || !uploadedImageUrl || !uploadedImageKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocation.id,
          title: adTitle,
          description: (isTemplate ? sale.details : description) || undefined,
          template: isTemplate ? "sale" : undefined,
          templateData: isTemplate ? sale : undefined,
          imageUrl: uploadedImageUrl,
          imageKey: uploadedImageKey,
          contactPhone:   contactPhone   || undefined,
          contactAddress: contactAddress || undefined,
          contactWebsite: contactWebsite || undefined,
          showPhone,
          showAddress,
          showWebsite,
          isTest: asTest || undefined,
          demoId: demo?.id,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // A demo ad goes back to the demo; a test ad skips payment: open the store's preview screen on it
      router.push(demo ? `/dashboard/sales/${demo.leadId}#demos` : asTest
        ? `/display/${selectedLocation.slug}?preview=brand&ad=${json.data.id}`
        : `/ads/${json.data.id}/payment`);
    } catch (e: any) {
      setError(e.message || "Failed to submit ad");
      setLoading(false);
    }
  };

  // The screen preview doubles as the image upload on the Details step (and in the desktop panel)
  const droppablePreview = (node: React.ReactNode) => (
    <PreviewDropTarget
      onDrop={onDrop}
      onDropRejected={onDropRejected}
      hasImage={!!(uploadedImageUrl ?? imagePreview)}
      uploading={uploading}
      failed={!!imageFile && !uploading && !uploadedImageUrl}
    >
      {node}
    </PreviewDropTarget>
  );

  // The ad as it will look on a store screen: the animated template, the advertiser's own image
  // (with contact details beside it when turned on), or a placeholder until there's something to show
  // showFullscreen: the "Preview on display screen" button on the image (the desktop panel has its own in its header)
  const screenPreview = ({ showFullscreen = true }: { showFullscreen?: boolean } = {}): React.ReactNode => {
    const placeholder = (text: string) => (
      <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 10, background: "#0A1A2E", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
        <div style={{ color: "#9DC4E0", fontSize: 14, lineHeight: 1.5 }}>
          {text && <><div style={{ fontSize: 30, marginBottom: 8 }}>🖼️</div>{text}</>}
        </div>
      </div>
    );
    const templateStarted = !!(previewSale.offerBig || previewSale.headline || previewSale.businessName || uploadedImageUrl || imagePreview);
    if (isTemplate && !templateStarted) return placeholder("");
    if (isTemplate) {
      return (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", background: "#0A1A2E" }}>
          <SaleTemplate
            key={replay}
            data={previewSale}
            photoUrl={uploadedImageUrl ?? imagePreview}
            qrValue={showWebsite && contactWebsite ? contactWebsite : null}
            address={showAddress && contactAddress ? contactAddress : null}
            phone={showPhone && contactPhone ? contactPhone : null}
            website={showWebsite && contactWebsite ? contactWebsite : null}
            play
          />
        </div>
      );
    }
    const img = uploadedImageUrl ?? imagePreview;
    // Same rule as the screen: title and description show only beside contact details (split layout)
    if (!img && !(contactPhone || contactAddress || contactWebsite)) {
      return placeholder("");
    }

                  const hasSplit = !!(contactPhone || contactAddress || contactWebsite);
                  const titleLen = title.length;
                  const titleSize = titleLen <= 20 ? "clamp(18px, 3vw, 40px)" : titleLen <= 40 ? "clamp(14px, 2.2vw, 30px)" : "clamp(12px, 1.6vw, 22px)";
                  return (
                    <div style={{ position: "relative", background: "#0A1A2E", borderRadius: 8, overflow: "hidden" }}>
                      {hasSplit ? (
                        /* Split layout preview, in a screen's 16:9 shape; "safe center" keeps a long title visible
                           (any overflow is cut at the bottom, not the top) */
                        <div style={{ display: "flex", aspectRatio: "16 / 9" }}>
                          <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "safe center", overflow: "hidden", padding: "16px 20px", position: "relative", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.2)" }}>
                            <div style={{ fontFamily: "Georgia,serif", fontSize: titleSize, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>{title}</div>
                            {description && <div style={{ fontSize: "clamp(10px, 1vw, 13px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 10 }}>{description}</div>}
                            {(showPhone || showAddress || showWebsite) && (
                              <>
                                <div style={{ width: 28, height: 2, background: "#E8563A", borderRadius: 1, marginBottom: 8 }} />
                                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Contact Info</div>
                              </>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {showPhone && contactPhone && <div style={{ fontSize: "clamp(10px, 1vw, 13px)", color: "#fff", fontWeight: 600 }}>📞 {contactPhone}</div>}
                              {showAddress && contactAddress && <div style={{ fontSize: "clamp(10px, 1vw, 13px)", color: "#fff", fontWeight: 600 }}>📍 {contactAddress}</div>}
                              {showWebsite && contactWebsite && <div style={{ fontSize: "clamp(10px, 1vw, 13px)", color: "#4A90C4", fontWeight: 600 }}>🌐 {contactWebsite}</div>}
                            </div>
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            {img
                              ? <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              : <div style={{ width: "100%", height: "100%", background: "#13304F" }} /* the upload pill sits over this */ />}
                          </div>
                        </div>
                      ) : (
                        /* Full-screen preview */
                        <>
                          <img src={img ?? undefined} alt={title} style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "contain", display: "block" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 30%)", pointerEvents: "none" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", display: "flex", justifyContent: "flex-end" }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Ad #Preview</span>
                          </div>
                        </>
                      )}
                      {/* Preview button */}
                      {showFullscreen && <button
                        onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                        style={{
                          position: "absolute", top: 10, right: 10,
                          background: "rgba(10,26,46,0.75)", color: "#fff",
                          border: "none", borderRadius: 6, padding: "6px 12px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span>⛶</span> Preview on display screen
                      </button>}
                    </div>
                  );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px" }}>
      {/* Header + form: wide on desktop (form left, screen preview right); one column on phones */}
      <div style={{ width: "100%", maxWidth: 1400 }}>
        <a href={demo ? `/dashboard/sales/${demo.leadId}` : "/dashboard/user"} style={{ fontSize: 13, color: "#4A6B82", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
          {demo ? `← Back to ${demo.name}` : "← Back to dashboard"}
        </a>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>
          {demo ? `Demo ad · ${demo.name}` : "Post a New Ad"}
        </h1>
        <p style={{ color: "#4A6B82", fontSize: 14, marginBottom: 32 }}>
          {demo
            ? `${selectedLocation?.storeName ?? ""} · Shown only on this demo's private link, never on the store TV. No payment.`
            : <>{selectedLocation ? `${formatPrice(selectedLocation.pricePerRunCents)} / 4 weeks` : "Priced per store · 4 weeks"} · Displayed on in-store screens at your chosen location.</>}
        </p>

        <StepBar current={step} />

        <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Always a white card, so give it dark text too (the inherited colour is light in dark mode) */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: "clamp(18px, 4vw, 32px)", minWidth: 0, color: ACCENT }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
              {error}
            </div>
          )}

          {/* ── STEP 1: Location ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: ACCENT, marginBottom: 4 }}>Choose a location</h2>
              <p style={{ fontSize: 13, color: "#4A6B82", marginBottom: 24 }}>Pick the store where your ad will be displayed, or search by name, city or ZIP.</p>

              <div style={{ marginBottom: 8 }}>
                <Label>Search locations</Label>
                <Input
                  placeholder="Store name, store #, city, state, or ZIP code…"
                  value={locSearch}
                  onChange={(e) => handleLocSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {locLoading && (
                <p style={{ fontSize: 13, color: "#4A6B82", margin: "8px 0" }}>Searching…</p>
              )}

              {!locLoading && locSearched && locations.length === 0 && (
                <div style={{ fontSize: 13, color: "#4A6B82", background: "#F4F7FB", border: "1px solid #D8E4EE", borderRadius: 8, padding: "12px 16px", margin: "8px 0" }}>
                  No locations found for &ldquo;{locSearch}&rdquo;. Try a different store name or city.
                </div>
              )}

              {!searching && allLocations === null && (
                <p style={{ fontSize: 13, color: "#4A6B82", margin: "8px 0" }}>Loading stores…</p>
              )}

              {shownLocations.length > 0 && (
                <div style={{ border: "1px solid #D8E4EE", borderRadius: 8, overflow: "hidden", margin: "8px 0", maxHeight: 380, overflowY: "auto" }}>
                  {shownLocations.map((loc, i) => {
                    const picked = selectedLocation?.id === loc.id;
                    return (
                    <button
                      key={loc.id}
                      onClick={() => { setSelectedLocation(loc); setLocations([]); setLocSearch(""); setLocSearched(false); }}
                      aria-pressed={picked}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        background: picked ? "#E3F0FB" : "#fff",
                        border: "none",
                        borderBottom: i < shownLocations.length - 1 ? "1px solid #D8E4EE" : "none",
                        // Picked store: blue outline drawn inside the row so the list doesn't shift
                        boxShadow: picked ? "inset 0 0 0 2px #4A90C4" : "none",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ fontWeight: 600, color: ACCENT }}>
                          {loc.storeName}
                          {picked && (
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#fff", background: "#4A90C4", borderRadius: 999, padding: "2px 8px", verticalAlign: "middle" }}>
                              ✓ Selected
                            </span>
                          )}
                        </span>
                        <span style={{ fontWeight: 700, color: "#E8563A", whiteSpace: "nowrap" }}>{formatPrice(loc.pricePerRunCents)}<span style={{ fontWeight: 400, fontSize: 12, color: "#4A6B82" }}> / 4 weeks</span></span>
                      </div>
                      <div style={{ fontSize: 12, color: "#4A6B82" }}>
                        {loc.addressLine1}, {loc.city.name}, {loc.state.code} {loc.postalCode?.code}
                        {loc.storeNumber && <StoreNumber value={loc.storeNumber} />}
                      </div>
                      {loc.dailyCustomers ? <ShopperReach loc={loc} /> : null}
                    </button>
                    );
                  })}
                </div>
              )}

              <p style={{ fontSize: 12, color: "#4A6B82", margin: "10px 0 0", lineHeight: 1.5 }}>
                📍 Screens are for <strong>local businesses</strong>: choose a store within about {LOCAL_AD_RADIUS_MILES} miles of your business, or one whose area you serve. Ads for businesses farther away may be declined and refunded.
              </p>

              {/* Only when the picked store isn't in the list on screen (e.g. while searching for another) */}
              {selectedLocation && !shownLocations.some(l => l.id === selectedLocation.id) && (
                <div style={{ background: "#F0F7FF", border: "1px solid #4A90C4", borderRadius: 8, padding: "12px 16px", marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A5C" }}>Selected: {selectedLocation.storeName}</div>
                  <div style={{ fontSize: 12, color: "#4A6B82" }}>
                    {selectedLocation.addressLine1}, {selectedLocation.city.name}, {selectedLocation.state.code} {selectedLocation.postalCode?.code}
                    {selectedLocation.storeNumber && <StoreNumber value={selectedLocation.storeNumber} />}
                  </div>
                  {selectedLocation.dailyCustomers ? <ShopperReach loc={selectedLocation} /> : null}
                </div>
              )}

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={() => { if (!selectedLocation) { setError("Please select a location."); return; } setError(""); setStep(2); }} disabled={!selectedLocation}>
                  Next: Ad Details →
                </Btn>
              </div>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: ACCENT, marginBottom: 4 }}>Ad details</h2>
              <p style={{ fontSize: 13, color: "#4A6B82", marginBottom: 16 }}>Use our template and we&apos;ll design and animate your ad, or upload your own design.</p>

              {/* Design choice */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 22 }}>
                {([
                  { v: "template", t: "✨ Use the Sale template", d: "Sharp, animated and easy to read from across the store. Just fill in your offer." },
                  { v: "own", t: "🖼️ Upload your own design", d: "Already have a flyer or graphic? Upload it as an image." },
                ] as const).map(o => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setDesign(o.v)}
                    style={{
                      textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      border: design === o.v ? "2px solid #4A90C4" : "1px solid #D8E4EE",
                      background: design === o.v ? "#E3F0FB" : "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: ACCENT }}>{o.t}</div>
                    <div style={{ fontSize: 12, color: "#4A6B82", marginTop: 3, lineHeight: 1.45 }}>{o.d}</div>
                  </button>
                ))}
              </div>

              {isTemplate && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px 14px" }}>
                    {([
                      { k: "businessName", label: "Business name *", ph: "Joe's Pizza" },
                      { k: "headline", label: "Headline *", ph: "any large pizza" },
                      { k: "offerBig", label: "Offer, big *", ph: "20%  ·  $5  ·  BOGO" },
                      { k: "offerSmall", label: "Offer, small", ph: "OFF" },
                      { k: "details", label: "Details", ph: "Dine-in or takeout · this week only" },
                      { k: "ends", label: "Ends", ph: "Ends Nov 9" },
                    ] as const).map(f => (
                      <div key={f.k}>
                        <Label>{f.label}</Label>
                        <Input
                          placeholder={f.ph}
                          value={sale[f.k]}
                          maxLength={SALE_LIMITS[f.k]}
                          onChange={e => setSaleField(f.k, e.target.value)}
                        />
                        <div style={{ fontSize: 11, color: "#4A6B82", marginTop: 3, textAlign: "right" }}>{sale[f.k].length}/{SALE_LIMITS[f.k]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="lg:hidden">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 6px" }}>
                      <Label>Live preview · photo *</Label>
                      <button type="button" onClick={() => setReplay(r => r + 1)} style={{ fontSize: 12, fontWeight: 600, color: "#4A90C4", background: "none", border: "none", cursor: "pointer" }}>↻ Replay</button>
                    </div>
                    {droppablePreview(screenPreview())}
                  </div>
                  <p style={{ fontSize: 11, color: "#5B7D96", marginTop: 6 }}>
                    Add your photo by clicking the screen preview or dropping it there. Below, the address appears on the ad and the website becomes a QR code.
                  </p>
                </div>
              )}

              {!isTemplate && (<>
              <div style={{ marginBottom: 20 }}>
                <Label>Ad title *</Label>
                <Input
                  placeholder="e.g. Grand Opening Sale — 30% Off!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
                <div style={{ fontSize: 11, color: "#4A6B82", marginTop: 4, textAlign: "right" }}>{title.length}/120</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Additional details shown below the image…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
                <div style={{ fontSize: 11, color: "#4A6B82", marginTop: 4, textAlign: "right" }}>{description.length}/500</div>
              </div>

              <p style={{ fontSize: 11, color: "#5B7D96", marginBottom: 16 }}>
                Add your image by clicking the screen preview or dropping it there. The screen shows your title and description beside the image only when a contact detail below is filled in; otherwise the image fills the screen.
              </p>
              <div className="lg:hidden" style={{ marginBottom: 20 }}>
                <Label>Live preview · image *</Label>
                <div style={{ marginTop: 6 }}>{droppablePreview(screenPreview())}</div>
              </div>
              </>)}

              {/* Contact info */}
              <div style={{ borderTop: "1px solid #D8E4EE", paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>
                  Contact Information
                </div>
                <p style={{ fontSize: 12, color: "#4A6B82", marginBottom: 16 }}>
                  Optional — toggle each field to show it on the display screen with your ad. Great if you don't have a designed flyer.
                </p>
                {[
                  { label: "Phone", value: contactPhone, set: setContactPhone, show: showPhone, setShow: setShowPhone, placeholder: "(555) 123-4567", icon: "📞" },
                  { label: "Address", value: contactAddress, set: setContactAddress, show: showAddress, setShow: setShowAddress, placeholder: "123 Main St, Seattle, WA", icon: "📍" },
                  { label: "Website URL", value: contactWebsite, set: setContactWebsite, show: showWebsite, setShow: setShowWebsite, placeholder: "https://yourwebsite.com", icon: "🌐" },
                ].map(({ label, value, set, show, setShow, placeholder, icon }) => (
                  <div key={label} style={{ marginBottom: 14, background: "#F7F9FC", borderRadius: 10, padding: "12px 14px", border: "1px solid #D8E4EE" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <Label>{icon} {label}</Label>
                      <Toggle checked={show} onChange={setShow} label="Show on display" />
                    </div>
                    <Input
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                    />
                  </div>
                ))}
                {!demo && (
                <p style={{ fontSize: 11, color: "#5B7D96", marginTop: 4 }}>
                  Contact info is saved to your profile and pre-filled on future ads.
                </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <Btn secondary onClick={() => (demo ? router.push(`/dashboard/sales/${demo.leadId}`) : setStep(1))}>← Back</Btn>
                <Btn onClick={() => {
                  if (isTemplate) {
                    const check = saleTemplateSchema.safeParse(sale);
                    if (!check.success) { setError(check.error.issues[0]?.message ?? "Please fill in the template."); return; }
                  } else if (title.trim().length < 3) { setError("Title must be at least 3 characters."); return; }
                  if (uploading) { setError("Your image is still uploading. One moment."); return; }
                  if (!uploadedImageUrl) { setError(`Please add your ${isTemplate ? "photo" : "image"}: click the screen preview or drop it there.`); return; }
                  setError(""); setStep(4);
                }}>
                  {demo ? "Next: Review →" : <>Next: Review &amp; Pay →</>}
                </Btn>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: ACCENT, marginBottom: 4 }}>Review & submit</h2>
              <p style={{ fontSize: 13, color: "#4A6B82", marginBottom: 24 }}>
                {demo
                  ? <>Confirm the demo ad. No payment: it shows only on this demo&apos;s private link.</>
                  : <>Confirm your ad details. Payment of <strong>{selectedLocation ? `$${(selectedLocation.pricePerRunCents / 100).toFixed(2)}` : ""}</strong> is collected on the next step.</>}
              </p>

              {/* Summary */}
              <div style={{ background: "#F4F7FB", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                {/* Phones: the screen preview sits here; on desktop it's pinned in the right column */}
                {uploadedImageUrl && <div className="lg:hidden" style={{ marginBottom: 16 }}>{screenPreview()}</div>}
                {/* Own text colour: the page's inherited text colour is light in dark mode, on this light box */}
                <div style={{ display: "grid", gap: 10, fontSize: 14, color: ACCENT }}>
                  <div><span style={{ color: "#4A6B82" }}>Location:</span> <strong>{selectedLocation?.storeName}</strong>{selectedLocation?.storeNumber && <StoreNumber value={selectedLocation.storeNumber} />}</div>
                  <div><span style={{ color: "#4A6B82" }}>Title:</span> <strong>{adTitle}</strong>{isTemplate && <span style={{ color: "#4A6B82" }}> · Sale template</span>}</div>
                  {!isTemplate && description && <div><span style={{ color: "#4A6B82" }}>Description:</span> {description}</div>}
                  {demo ? (
                    <div><span style={{ color: "#4A6B82" }}>Shown:</span> on the demo link only, until it expires · no payment</div>
                  ) : (
                    <>
                      <div><span style={{ color: "#4A6B82" }}>Duration:</span> 4 weeks (28 days)</div>
                      <div><span style={{ color: "#4A6B82" }}>Price:</span> <strong style={{ color: RED }}>{selectedLocation ? `$${(selectedLocation.pricePerRunCents / 100).toFixed(2)}` : ""}</strong> <span style={{ color: "#4A6B82" }}>/ 4 weeks</span></div>
                    </>
                  )}
                  {(showPhone || showAddress || showWebsite) && (
                    <div style={{ marginTop: 8, borderTop: "1px solid #D8E4EE", paddingTop: 8 }}>
                      <div style={{ fontSize: 12, color: "#4A6B82", marginBottom: 4, fontWeight: 600 }}>Shown on display:</div>
                      {showPhone   && contactPhone   && <div style={{ fontSize: 13 }}>📞 {contactPhone}</div>}
                      {showAddress && contactAddress && <div style={{ fontSize: 13 }}>📍 {contactAddress}</div>}
                      {showWebsite && contactWebsite && <div style={{ fontSize: 13 }}>🌐 {contactWebsite}</div>}
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && !demo && (
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#F0F7FF", border: "1px solid #C9DFF2", borderRadius: 8, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: "#1A3A5C", cursor: "pointer", lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    checked={asTest}
                    onChange={e => setAsTest(e.target.checked)}
                    style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: "#1A3A5C" }}
                  />
                  <span>
                    <strong>Post as a test ad</strong> (admins only): no payment or review. It shows only on preview screens (<code>?preview=</code>), never on the store TV, and doesn&apos;t count anywhere.
                  </span>
                </label>
              )}

              {!asTest && (
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#1A3A5C", cursor: "pointer", lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={localConfirmed}
                  onChange={e => setLocalConfirmed(e.target.checked)}
                  style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: "#1A3A5C" }}
                />
                <span>
                  My business is within about {LOCAL_AD_RADIUS_MILES} miles of <strong>{selectedLocation?.storeName ?? "this store"}</strong>, or serves customers in its area. I understand ads for businesses farther away may be declined and refunded.
                </span>
              </label>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <Btn secondary onClick={() => setStep(2)}>← Back</Btn>
                <Btn onClick={submitAd} disabled={loading || (!asTest && !localConfirmed)}>
                  {loading ? "Submitting…" : demo ? "Add to demo →" : asTest ? "Post test ad →" : "Submit & Pay →"}
                </Btn>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: the screen preview stays in view while the form scrolls */}
        <aside className="hidden lg:block sticky top-6">
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: ACCENT }}>Screen preview</div>
              {isTemplate ? (
                <button type="button" onClick={() => setReplay(r => r + 1)} style={{ fontSize: 12, fontWeight: 600, color: "#4A90C4", background: "none", border: "none", cursor: "pointer" }}>↻ Replay</button>
              ) : uploadedImageUrl ? (
                <button type="button" onClick={() => setShowPreview(true)} style={{ fontSize: 12, fontWeight: 600, color: "#4A90C4", background: "none", border: "none", cursor: "pointer" }}>⛶ Full screen</button>
              ) : null}
            </div>
            {step >= 2 ? droppablePreview(screenPreview({ showFullscreen: false })) : screenPreview({ showFullscreen: false })}
            <div style={{ fontSize: 12, color: "#4A6B82", marginTop: 10 }}>
              {selectedLocation
                ? <>Showing at <strong style={{ color: ACCENT }}>{selectedLocation.storeName}</strong> · {formatPrice(selectedLocation.pricePerRunCents)} / 4 weeks</>
                : "Choose a store to see where your ad will run."}
            </div>
          </div>
        </aside>
        </div>
      </div>

      {/* ── Display screen preview modal ── */}
      {showPreview && !isTemplate && uploadedImageUrl && (() => {
        const hasSplit = !!(contactPhone || contactAddress || contactWebsite);
        const titleLen = title.length;
        const titleSize = titleLen <= 20 ? "clamp(28px, 4vw, 58px)" : titleLen <= 40 ? "clamp(20px, 2.8vw, 42px)" : "clamp(15px, 2vw, 30px)";
        return (
          <div
            onClick={() => setShowPreview(false)}
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
                  {/* Left panel */}
                  <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(20px, 4vw, 52px)", position: "relative", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.15)" }}>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: titleSize, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: "clamp(10px, 1.5vw, 20px)" }}>{title}</div>
                    {description && <div style={{ fontSize: "clamp(11px, 1.2vw, 17px)", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: "clamp(12px, 1.8vw, 24px)" }}>{description}</div>}
                    {(showPhone || showAddress || showWebsite) && (
                      <>
                        <div style={{ width: 40, height: 3, background: "#E8563A", borderRadius: 2, marginBottom: "clamp(8px, 1.2vw, 16px)" }} />
                        <div style={{ fontSize: "clamp(9px, 0.8vw, 11px)", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "clamp(8px, 1vw, 14px)" }}>Contact Info</div>
                      </>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 14px)" }}>
                      {showPhone && contactPhone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "clamp(12px, 1.3vw, 18px)", color: "#fff", fontWeight: 600 }}>📞 {contactPhone}</div>}
                      {showAddress && contactAddress && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "clamp(12px, 1.3vw, 18px)", color: "#fff", fontWeight: 600 }}>📍 {contactAddress}</div>}
                      {showWebsite && contactWebsite && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "clamp(12px, 1.3vw, 18px)", color: "#4A90C4", fontWeight: 600 }}>🌐 {contactWebsite}</div>}
                    </div>
                  </div>
                  {/* Right panel */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <img src={uploadedImageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                </>
              ) : (
                <>
                  <img src={uploadedImageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 18%)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 32px", display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "clamp(10px, 1.2vw, 15px)", color: "rgba(255,255,255,0.6)" }}>Ad #Preview</span>
                  </div>
                </>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 20 }}>
              This is how your ad will appear on the in-store display screen · Click anywhere or press Esc to close
            </p>
          </div>
        );
      })()}
    </div>
  );
}
