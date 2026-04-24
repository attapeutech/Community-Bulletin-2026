"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

// ─── Types ───────────────────────────────────────────────────────────────────
type Location = {
  id: string;
  storeName: string;
  slug: string;
  addressLine1: string;
  city: { name: string };
  state: { code: string };
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

  // Form state
  const [locations, setLocations] = useState<Location[]>([]);
  const [locSearch, setLocSearch] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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
    searchTimeout.current = setTimeout(async () => {
      if (val.trim().length < 2) { setLocations([]); return; }
      setLocLoading(true);
      try {
        const res = await fetch(`/api/locations?search=${encodeURIComponent(val)}`);
        const json = await res.json();
        if (json.success) setLocations(json.data);
      } catch { /* ignore */ } finally {
        setLocLoading(false);
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
      // Get presigned URL
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: imageFile.name,
          contentType: imageFile.type,
          folder: "ads",
        }),
      });
      const presignJson = await presignRes.json();
      if (!presignJson.success) throw new Error(presignJson.error);

      const { uploadUrl, key, publicUrl } = presignJson.data;

      // Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      setUploadedImageUrl(publicUrl);
      setUploadedImageKey(key);
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

              <div style={{ marginBottom: 16 }}>
                <Label>Search locations</Label>
                <Input
                  placeholder="Type store name, city…"
                  value={locSearch}
                  onChange={(e) => handleLocSearch(e.target.value)}
                />
              </div>

              {locLoading && <p style={{ fontSize: 13, color: "#6B8FA8" }}>Searching…</p>}

              {locations.length > 0 && (
                <div style={{ border: "1px solid #D8E4EE", borderRadius: 8, overflow: "hidden" }}>
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => { setSelectedLocation(loc); setLocations([]); setLocSearch(""); }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        background: "#fff",
                        border: "none",
                        borderBottom: "1px solid #D8E4EE",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: ACCENT }}>{loc.storeName}</div>
                      <div style={{ fontSize: 12, color: "#6B8FA8" }}>
                        {loc.addressLine1} · {loc.city.name}, {loc.state.code}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedLocation && (
                <div style={{ background: "#F0F7FF", border: "1px solid #4A90C4", borderRadius: 8, padding: "12px 16px", marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A5C" }}>Selected: {selectedLocation.storeName}</div>
                  <div style={{ fontSize: 12, color: "#6B8FA8" }}>
                    {selectedLocation.addressLine1} · {selectedLocation.city.name}, {selectedLocation.state.code}
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
                {uploadedImageUrl && (
                  <img src={uploadedImageUrl} alt={title} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 16 }} />
                )}
                <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                  <div><span style={{ color: "#6B8FA8" }}>Location:</span> <strong>{selectedLocation?.storeName}</strong></div>
                  <div><span style={{ color: "#6B8FA8" }}>Title:</span> <strong>{title}</strong></div>
                  {description && <div><span style={{ color: "#6B8FA8" }}>Description:</span> {description}</div>}
                  <div><span style={{ color: "#6B8FA8" }}>Duration:</span> 1 week</div>
                  <div><span style={{ color: "#6B8FA8" }}>Price:</span> <strong style={{ color: RED }}>$100.00</strong></div>
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
    </div>
  );
}
