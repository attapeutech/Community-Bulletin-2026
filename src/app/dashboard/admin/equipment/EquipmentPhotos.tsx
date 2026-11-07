"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

export const MAX_PHOTOS = 12;
export const photoSrc = (id: string, thumb = false) => `/api/admin/equipment/photos/${id}${thumb ? "?size=thumb" : ""}`;

/** Re-encode a photo as a JPEG no larger than maxSide px (drops GPS/EXIF data; turns iPhone HEIC into JPEG). */
async function shrink(file: File, maxSide: number, quality: number): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Older Safari: fall back to an <img>
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("unreadable"));
      img.src = URL.createObjectURL(file);
    });
  }
  const w = source.width, h = source.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("unreadable");
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  else URL.revokeObjectURL(source.src);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("unreadable"))), "image/jpeg", quality));
}

/** Shrink and upload one photo; returns the new photo id. */
export async function uploadPhoto(itemId: string, file: File): Promise<string> {
  let full: Blob, thumb: Blob;
  try {
    [full, thumb] = await Promise.all([shrink(file, 1600, 0.82), shrink(file, 400, 0.75)]);
  } catch {
    throw new Error(`Couldn't read ${file.name}. Try a JPEG or PNG photo.`);
  }
  const form = new FormData();
  form.append("file", full, "photo.jpg");
  form.append("thumb", thumb, "thumb.jpg");
  const res = await fetch(`/api/admin/equipment/${itemId}/photos`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({ success: false, error: "Upload failed" }));
  if (!json.success) throw new Error(json.error || "Upload failed");
  return json.data.id;
}

/** "Add photos" button: on phones it offers the camera or the photo library. */
export function AddPhotosButton({ onFiles, disabled, busy }: { onFiles: (files: File[]) => void; disabled?: boolean; busy?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled || busy}
        className="w-20 h-20 rounded-lg border-2 border-dashed border-[#B8CCDD] text-[#4A6B82] hover:border-[#4A90C4] hover:text-[#1A3A5C] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold disabled:opacity-50 transition-colors"
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        {busy ? "Uploading" : "Add photos"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </>
  );
}

/** Full-size viewer with previous / next (arrow keys) and close (Esc). */
export function PhotoViewer({ ids, start, onClose }: { ids: string[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((n) => (n + 1) % ids.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + ids.length) % ids.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids.length, onClose]);

  if (!ids.length) return null;
  const btn = "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center";
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Photo">
      <img
        src={photoSrc(ids[i])}
        alt={`Photo ${i + 1} of ${ids.length}`}
        className="max-w-full max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Close"><X size={26} /></button>
      {ids.length > 1 && (
        <>
          <button type="button" className={`${btn} left-3`} onClick={(e) => { e.stopPropagation(); setI((i - 1 + ids.length) % ids.length); }} aria-label="Previous"><ChevronLeft /></button>
          <button type="button" className={`${btn} right-3`} onClick={(e) => { e.stopPropagation(); setI((i + 1) % ids.length); }} aria-label="Next"><ChevronRight /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">{i + 1} / {ids.length}</div>
        </>
      )}
    </div>
  );
}

/** Photo grid inside the add / edit form. */
export function FormPhotos({
  saved, pending, onDeleteSaved, onRemovePending, onFiles, busy,
}: {
  saved: string[];                       // uploaded photo ids
  pending: { file: File; url: string }[]; // picked before the item exists (uploaded on save)
  onDeleteSaved: (id: string) => void;
  onRemovePending: (index: number) => void;
  onFiles: (files: File[]) => void;
  busy: boolean;
}) {
  const [viewing, setViewing] = useState<number | null>(null);
  const total = saved.length + pending.length;
  const x = "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1A3A5C] text-white flex items-center justify-center shadow";
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {saved.map((id, n) => (
          <div key={id} className="relative">
            <button type="button" onClick={() => setViewing(n)} className="block w-20 h-20 rounded-lg overflow-hidden border border-[#D8E4EE] bg-[#F7F9FC]">
              <img src={photoSrc(id, true)} alt="" className="w-full h-full object-cover" />
            </button>
            <button type="button" className={x} onClick={() => onDeleteSaved(id)} aria-label="Delete photo"><X size={12} /></button>
          </div>
        ))}
        {pending.map((p, n) => (
          <div key={p.url} className="relative">
            <img src={p.url} alt="" className="w-20 h-20 rounded-lg object-cover border border-dashed border-[#B8CCDD]" />
            <button type="button" className={x} onClick={() => onRemovePending(n)} aria-label="Remove photo"><X size={12} /></button>
          </div>
        ))}
        {total < MAX_PHOTOS && <AddPhotosButton onFiles={onFiles} busy={busy} />}
      </div>
      {pending.length > 0 && <p className="text-[11px] text-[#6B7A8C] mt-1">These upload when you save.</p>}
      {viewing !== null && <PhotoViewer ids={saved} start={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
