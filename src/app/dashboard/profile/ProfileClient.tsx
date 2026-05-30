"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

/* ── Field-level validation error ──────────────────────────── */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-700">{msg}</p>;
}

/* ── Inline error banner ────────────────────────────────────── */
function InlineError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <Alert variant="destructive" className="mb-3.5 py-2.5 px-3.5">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-[13px]">{msg}</AlertDescription>
    </Alert>
  );
}

/* ── Inline success banner ──────────────────────────────────── */
function InlineSuccess({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-lg px-3.5 py-2.5 mb-3.5">
      <CheckCircle2 className="h-[15px] w-[15px] shrink-0 text-green-600" />
      <span className="text-[13px]">{msg}</span>
    </div>
  );
}

/* ── Name form ─────────────────────────────────────────────── */
const nameSchema = z.object({ name: z.string().min(2, "Name must be at least 2 characters") });
type NameForm = z.infer<typeof nameSchema>;

function NameSection({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: initialName },
  });

  async function onSubmit(data: NameForm) {
    setError(null); setSuccess(null);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to update name."); return; }
    setSuccess("Name updated successfully.");
    router.refresh();
  }

  return (
    <Card className="mb-6 rounded-xl border-[#E2EAF2]">
      <CardHeader className="pb-1">
        <CardTitle className="font-serif text-base text-[#1A3A5C]">Personal information</CardTitle>
        <CardDescription className="text-xs text-[#6B8FA8]">Update your display name.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <label className="block mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
              Full name
            </label>
            <Input
              type="text"
              {...register("name")}
              className={errors.name ? "border-red-300 bg-red-50" : "border-[#D1DDE8] bg-[#F7F9FC]"}
            />
            <FieldError msg={errors.name?.message} />
          </div>
          <InlineError msg={error} />
          <InlineSuccess msg={success} />
          <Button type="submit" disabled={isSubmitting} className="bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 h-9 px-5 text-[13px]">
            {isSubmitting ? "Saving…" : "Save name"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── Password form ─────────────────────────────────────────── */
const pwSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { message: "Passwords do not match", path: ["confirm"] });
type PwForm = z.infer<typeof pwSchema>;

function PasswordSection() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  });

  async function onSubmit(data: PwForm) {
    setError(null); setSuccess(null);
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to update password."); return; }
    setSuccess("Password updated successfully.");
    reset();
  }

  return (
    <Card className="mb-6 rounded-xl border-[#E2EAF2]">
      <CardHeader className="pb-1">
        <CardTitle className="font-serif text-base text-[#1A3A5C]">Change password</CardTitle>
        <CardDescription className="text-xs text-[#6B8FA8]">Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-3.5">
            <label className="block mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
              Current password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register("currentPassword")}
              className={errors.currentPassword ? "border-red-300 bg-red-50" : "border-[#D1DDE8] bg-[#F7F9FC]"}
            />
            <FieldError msg={errors.currentPassword?.message} />
          </div>
          <div className="mb-3.5">
            <label className="block mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
              New password
            </label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              {...register("newPassword")}
              className={errors.newPassword ? "border-red-300 bg-red-50" : "border-[#D1DDE8] bg-[#F7F9FC]"}
            />
            <FieldError msg={errors.newPassword?.message} />
          </div>
          <div className="mb-4">
            <label className="block mb-1.5 text-[11px] font-semibold text-[#4A5568] uppercase tracking-[0.04em]">
              Confirm new password
            </label>
            <Input
              type="password"
              placeholder="Re-enter new password"
              {...register("confirm")}
              className={errors.confirm ? "border-red-300 bg-red-50" : "border-[#D1DDE8] bg-[#F7F9FC]"}
            />
            <FieldError msg={errors.confirm?.message} />
          </div>
          <InlineError msg={error} />
          <InlineSuccess msg={success} />
          <Button type="submit" disabled={isSubmitting} className="bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 h-9 px-5 text-[13px]">
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── Avatar upload ────────────────────────────────────────── */
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function AvatarSection({ name, email, image }: { name: string; email: string; image: string | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(image);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileRef.current) return;
    fileRef.current.value = "";
    if (!file) return;

    setError(null); setSuccess(null);

    if (!ALLOWED.includes(file.type)) { setError("JPEG, PNG or WebP only."); return; }
    if (file.size > MAX_BYTES) { setError("File must be under 5 MB."); return; }

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      // 1. Upload to R2 via server (avoids browser CORS on R2)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      const uploadRes  = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) throw new Error(uploadJson.error ?? "Upload failed");

      const { publicUrl } = uploadJson.data;

      // 2. Save URL to user profile
      const saveRes  = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: publicUrl }) });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson.error ?? "Failed to save photo");

      setPreview(publicUrl);
      setSuccess("Profile photo updated.");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Upload failed. Please try again.");
      setPreview(image); // revert preview on error
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null); setSuccess(null); setUploading(true);
    try {
      const res  = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: null }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to remove photo");
      setPreview(null);
      setSuccess("Profile photo removed.");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to remove. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="mb-6 rounded-xl border-[#E2EAF2]">
      <CardHeader className="pb-1">
        <CardTitle className="font-serif text-base text-[#1A3A5C]">Profile photo</CardTitle>
        <CardDescription className="text-xs text-[#6B8FA8]">Upload a photo to personalise your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          {/* Avatar with click-to-upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative shrink-0 group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A5C]"
            title="Click to upload photo"
          >
            <Avatar className="w-[72px] h-[72px]">
              {preview && <AvatarImage src={preview} alt={name} className="object-cover" />}
              <AvatarFallback className="bg-[#1A3A5C] text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {uploading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-5 h-5 text-white" />
              }
            </div>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#1A3A5C] mb-0.5 truncate">{name}</div>
            <div className="text-xs text-[#6B8FA8] mb-3">{email}</div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="h-8 text-xs border-[#D1DDE8] text-[#1A3A5C]"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {uploading ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
              </Button>
              {preview && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={handleRemove}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-[#6B8FA8] mt-2">JPEG, PNG or WebP · max 5 MB</p>
          </div>
        </div>

        {(error || success) && (
          <div className="mt-4">
            <InlineError msg={error} />
            <InlineSuccess msg={success} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── 2FA toggle ───────────────────────────────────────────── */
function TwoFactorSection({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true); setError(null); setSuccess(null);
    const next = !on;
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twoFactorEnabled: next }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to update 2FA setting."); setLoading(false); return; }
    setOn(next);
    setSuccess(next ? "Two-factor authentication enabled. You'll receive an email code on your next login." : "Two-factor authentication disabled.");
    setLoading(false);
    router.refresh();
  }

  return (
    <Card className="mb-6 rounded-xl border-[#E2EAF2]">
      <CardHeader className="pb-1">
        <CardTitle className="font-serif text-base text-[#1A3A5C]">Two-factor authentication</CardTitle>
        <CardDescription className="text-xs text-[#6B8FA8]">Add an extra layer of security to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`flex items-center justify-between rounded-[10px] px-5 py-4 border ${on ? "bg-green-50 border-green-200" : "bg-[#F7F9FC] border-[#D1DDE8]"}`}>
          <div>
            <div className="text-sm font-semibold text-[#1A3A5C] mb-0.5">
              Email verification code
            </div>
            <div className="text-xs text-[#6B8FA8]">
              {on
                ? "A 6-digit code will be sent to your email on each login."
                : "Enable to receive a one-time code by email when you sign in."}
            </div>
          </div>
          <Switch
            checked={on}
            onCheckedChange={handleToggle}
            disabled={loading}
            className="shrink-0 ml-4"
          />
        </div>

        <div className="mt-3.5">
          <InlineError msg={error} />
          <InlineSuccess msg={success} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main export ──────────────────────────────────────────── */
export function ProfileClient({
  name,
  email,
  image,
  twoFactorEnabled,
}: {
  name: string;
  email: string;
  image: string | null;
  twoFactorEnabled: boolean;
}) {
  return (
    <div className="max-w-[600px]">
      <h1 className="font-serif font-bold text-[22px] text-[#1A3A5C] mb-1">
        Account settings
      </h1>
      <p className="text-[13px] text-[#6B8FA8] mb-7">
        Manage your profile and security preferences.
      </p>

      <AvatarSection name={name} email={email} image={image} />
      <NameSection initialName={name} />
      <PasswordSection />
      <TwoFactorSection enabled={twoFactorEnabled} />
    </div>
  );
}
