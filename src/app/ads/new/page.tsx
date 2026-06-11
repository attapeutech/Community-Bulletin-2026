"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

// ─── Types ───────────────────────────────────────────────────────────────────
type Location = {
  id: string;
  storeName: string;
  slug: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: { name: string };
  state: { code: string };
  postalCode: { code: string };
};

type Step = 1 | 2 | 3 | 4;

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
      <span style={{ fontSize: 12, color: checked ? ACCENT : "#6B8FA8", fontWeight: checked ? 600 : 400 }}>
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
const STEPS = ["Location", "Details", "Image", "Review"];

function StepBar({ current }: { current: Step }) {
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const num = (i + 1) as Step;
        const done = current > num;
        const active = current === num;
        return (
          <div key={label} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? "#16a34a" : active ? ACCENT : "#D8E4EE",
                color: done || active ? "#fff" : "#6B8FA8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
              }}>
                {done ? "✓" : num}
              </div>
              <div style={{ fontSize: 11, marginTop: 4, color: active ? ACCENT : "#6B8FA8", fontWeight: active ? 600 : 400 }}>
                {label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "#16a34a" : "#D8E4EE", marginBottom: 20 }} />
            )}
          </div>
        );
      })}
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [locSearch, setLocSearch] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locSearched, setLocSearched] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Contact info
  const [contactPhone,   setContactPhone]   = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactWebsite, setContactWebsite] = useState("");
  const [showPhone,   setShowPhone]   = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);

  // Pre-fill contact info from user profile
  useEffect(() => {
    fetch("/api/users/me")
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          if (j.data.phone)   setContactPhone(j.data.phone);
          if (j.data.address) setContactAddress(j.data.address);
          if (j.data.website) setContactWebsite(j.data.website);
        }
      })
      .catch(() => {});
  }, []);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Step 1: Location search ─────────────────────────────────────────────────
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

  // ── Step 3: Image upload via R2 presigned URL ───────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    const file = accepted[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl(null);
    setUploadedImageKey(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  const uploadImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "ads");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setUploadedImageUrl(json.data.publicUrl);
      setUploadedImageKey(json.data.key);
    } catch (e: any) {
      setError(e.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

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
          title,
          description: description || undefined,
          imageUrl: uploadedImageUrl,
          imageKey: uploadedImageKey,
          contactPhone:   contactPhone   || undefined,
          contactAddress: contactAddress || undefined,
          contactWebsite: contactWebsite || undefined,
          showPhone,
          showAddress,
          showWebsite,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push(`/ads/${json.data.id}/payment`);
    } catch (e: any) {
      setError(e.message || "Failed to submit ad");
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FB", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px" }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 640 }}>
        <a href="/dashboard/user" style={{ fontSize: 13, color: "#6B8FA8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
          ← Back to dashboard
        </a>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>
          Post a New Ad
        </h1>
        <p style={{ color: "#6B8FA8", fontSize: 14, marginBottom: 32 }}>
          $100 / 1 week · Displayed on in-store screens at your chosen location.
        </p>

        <StepBar current={step} />

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #D8E4EE", padding: 32 }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
              {error}
            </div>
          )}

          {/* ── STEP 1: Location ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: ACCENT, marginBottom: 4 }}>Choose a location</h2>
              <p style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 24 }}>Search for a store where your ad will be displayed.</p>

              <div style={{ marginBottom: 8 }}>
                <Label>Search locations</Label>
                <Input
                  placeholder="Store name, city, or state…"
                  value={locSearch}
                  onChange={(e) => handleLocSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {locLoading && (
                <p style={{ fontSize: 13, color: "#6B8FA8", margin: "8px 0" }}>Searching…</p>
              )}

              {!locLoading && locSearched && locations.length === 0 && (
                <div style={{ fontSize: 13, color: "#6B8FA8", background: "#F4F7FB", border: "1px solid #D8E4EE", borderRadius: 8, padding: "12px 16px", margin: "8px 0" }}>
                  No locations found for &ldquo;{locSearch}&rdquo;. Try a different store name or city.
                </div>
              )}

              {locations.length > 0 && (
                <div style={{ border: "1px solid #D8E4EE", borderRadius: 8, overflow: "hidden", margin: "8px 0" }}>
                  {locations.map((loc, i) => (
                    <button
                      key={loc.id}
                      onClick={() => { setSelectedLocation(loc); setLocations([]); setLocSearch(""); setLocSearched(false); }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        background: "#fff",
                        border: "none",
                        borderBottom: i < locations.length - 1 ? "1px solid #D8E4EE" : "none",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: ACCENT }}>{loc.storeName}</div>
                      <div style={{ fontSize: 12, color: "#6B8FA8" }}>
                        {loc.addressLine1}, {loc.city.name}, {loc.state.code} {loc.postalCode?.code}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedLocation && (
                <div style={{ background: "#F0F7FF", border: "1px solid #4A90C4", borderRadius: 8, padding: "12px 16px", marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A5C" }}>Selected: {selectedLocation.storeName}</div>
                  <div style={{ fontSize: 12, color: "#6B8FA8" }}>
                    {selectedLocation.addressLine1}, {selectedLocation.city.name}, {selectedLocation.state.code} {selectedLocation.postalCode?.code}
                  </div>
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
              <p style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 24 }}>Write a short title and optional description.</p>

              <div style={{ marginBottom: 20 }}>
                <Label>Ad title *</Label>
                <Input
                  placeholder="e.g. Grand Opening Sale — 30% Off!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
                <div style={{ fontSize: 11, color: "#6B8FA8", marginTop: 4, textAlign: "right" }}>{title.length}/120</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Additional details shown below the image…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
                <div style={{ fontSize: 11, color: "#6B8FA8", marginTop: 4, textAlign: "right" }}>{description.length}/500</div>
              </div>

              {/* Contact info */}
              <div style={{ borderTop: "1px solid #D8E4EE", paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>
                  Contact Information
                </div>
                <p style={{ fontSize: 12, color: "#6B8FA8", marginBottom: 16 }}>
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
                <p style={{ fontSize: 11, color: "#9DC4E0", marginTop: 4 }}>
                  Contact info is saved to your profile and pre-filled on future ads.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <Btn secondary onClick={() => setStep(1)}>← Back</Btn>
                <Btn onClick={() => {
                  if (title.trim().length < 3) { setError("Title must be at least 3 characters."); return; }
                  setError(""); setStep(3);
                }}>
                  Next: Upload Image →
                </Btn>
              </div>
            </div>
          )}

          {/* ── STEP 3: Image ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: ACCENT, marginBottom: 4 }}>Upload your image</h2>
              <p style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 24 }}>
                JPEG, PNG or WebP · Max 10 MB · Recommended: 1920×1080px (16:9)
              </p>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? ACCENT : "#D8E4EE"}`,
                  borderRadius: 12,
                  padding: 32,
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragActive ? "#F0F7FF" : "#FAFCFF",
                  transition: "all 0.2s",
                  marginBottom: 16,
                }}
              >
                <input {...getInputProps()} />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ maxHeight: 240, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                    <div style={{ fontSize: 14, color: "#6B8FA8" }}>
                      {isDragActive ? "Drop image here" : "Drag & drop or click to browse"}
                    </div>
                  </>
                )}
              </div>

              {imageFile && !uploadedImageUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#6B8FA8", marginBottom: 8 }}>{imageFile.name}</div>
                  <Btn onClick={uploadImage} disabled={uploading}>
                    {uploading ? "Uploading…" : "Upload Image"}
                  </Btn>
                </div>
              )}

              {uploadedImageUrl && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
                  ✓ Image uploaded successfully
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <Btn secondary onClick={() => setStep(2)}>← Back</Btn>
                <Btn onClick={() => {
                  if (!uploadedImageUrl) { setError("Please upload an image first."); return; }
                  setError(""); setStep(4);
                }} disabled={!uploadedImageUrl}>
                  Next: Review →
                </Btn>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: ACCENT, marginBottom: 4 }}>Review & submit</h2>
              <p style={{ fontSize: 13, color: "#6B8FA8", marginBottom: 24 }}>
                Confirm your ad details. Payment of <strong>$100.00</strong> is collected on the next step.
              </p>

              {/* Summary */}
              <div style={{ background: "#F4F7FB", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                {uploadedImageUrl && (() => {
                  const hasSplit = !!(contactPhone || contactAddress || contactWebsite);
                  const titleLen = title.length;
                  const titleSize = titleLen <= 20 ? "clamp(18px, 3vw, 40px)" : titleLen <= 40 ? "clamp(14px, 2.2vw, 30px)" : "clamp(12px, 1.6vw, 22px)";
                  return (
                    <div style={{ position: "relative", marginBottom: 16, background: "#0A1A2E", borderRadius: 8, overflow: "hidden" }}>
                      {hasSplit ? (
                        /* Split layout preview */
                        <div style={{ display: "flex", height: 240 }}>
                          <div style={{ width: "42%", background: "#0A1A2E", display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 20px", position: "relative", flexShrink: 0, borderRight: "1px solid rgba(74,144,196,0.2)" }}>
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
                            <img src={uploadedImageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        </div>
                      ) : (
                        /* Full-screen preview */
                        <>
                          <img src={uploadedImageUrl} alt={title} style={{ width: "100%", maxHeight: 240, objectFit: "contain", display: "block" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,26,46,0.75) 0%, transparent 30%)", pointerEvents: "none" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", display: "flex", justifyContent: "flex-end" }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Ad #Preview</span>
                          </div>
                        </>
                      )}
                      {/* Preview button */}
                      <button
                        onClick={() => setShowPreview(true)}
                        style={{
                          position: "absolute", top: 10, right: 10,
                          background: "rgba(10,26,46,0.75)", color: "#fff",
                          border: "none", borderRadius: 6, padding: "6px 12px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span>⛶</span> Preview on display screen
                      </button>
                    </div>
                  );
                })()}
                <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                  <div><span style={{ color: "#6B8FA8" }}>Location:</span> <strong>{selectedLocation?.storeName}</strong></div>
                  <div><span style={{ color: "#6B8FA8" }}>Title:</span> <strong>{title}</strong></div>
                  {description && <div><span style={{ color: "#6B8FA8" }}>Description:</span> {description}</div>}
                  <div><span style={{ color: "#6B8FA8" }}>Duration:</span> 1 week</div>
                  <div><span style={{ color: "#6B8FA8" }}>Price:</span> <strong style={{ color: RED }}>$100.00</strong></div>
                  {(showPhone || showAddress || showWebsite) && (
                    <div style={{ marginTop: 8, borderTop: "1px solid #D8E4EE", paddingTop: 8 }}>
                      <div style={{ fontSize: 12, color: "#6B8FA8", marginBottom: 4, fontWeight: 600 }}>Shown on display:</div>
                      {showPhone   && contactPhone   && <div style={{ fontSize: 13 }}>📞 {contactPhone}</div>}
                      {showAddress && contactAddress && <div style={{ fontSize: 13 }}>📍 {contactAddress}</div>}
                      {showWebsite && contactWebsite && <div style={{ fontSize: 13 }}>🌐 {contactWebsite}</div>}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <Btn secondary onClick={() => setStep(3)}>← Back</Btn>
                <Btn onClick={submitAd} disabled={loading}>
                  {loading ? "Submitting…" : "Submit & Pay →"}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Display screen preview modal ── */}
      {showPreview && uploadedImageUrl && (() => {
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
