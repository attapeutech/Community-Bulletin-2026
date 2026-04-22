"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

/* ── shared styles ─────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, border: "1px solid #E2EAF2", padding: "24px 28px", marginBottom: 24,
};
const cardTitle: React.CSSProperties = {
  fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 16, color: "#1A3A5C", marginBottom: 4,
};
const cardSub: React.CSSProperties = {
  fontSize: 12, color: "#6B8FA8", marginBottom: 20,
};
const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600,
  color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.04em",
};
const inputStyle = (err?: boolean): React.CSSProperties => ({
  width: "100%", height: 40, borderRadius: 8, padding: "0 12px",
  border: `1px solid ${err ? "#fca5a5" : "#D1DDE8"}`,
  background: err ? "#fff5f5" : "#F7F9FC",
  color: "#1A3A5C", fontSize: 14, outline: "none", boxSizing: "border-box",
});
const saveBtn = (loading: boolean): React.CSSProperties => ({
  height: 38, borderRadius: 8, border: "none", padding: "0 20px",
  background: "#1A3A5C", color: "#fff", fontSize: 13, fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
});

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ margin: "4px 0 0", fontSize: 12, color: "#b91c1c" }}>{msg}</p>;
}

function InlineError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "#FEF2F2", border: "1px solid #fca5a5", borderRadius: 8,
      padding: "10px 14px", marginBottom: 14,
      display: "flex", gap: 8, alignItems: "center",
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke="#b91c1c" strokeWidth="1.5"/>
        <path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 13, color: "#b91c1c" }}>{msg}</span>
    </div>
  );
}

function InlineSuccess({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8,
      padding: "10px 14px", marginBottom: 14,
      display: "flex", gap: 8, alignItems: "center",
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize: 13, color: "#15803d" }}>{msg}</span>
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
    <div style={card}>
      <p style={cardTitle}>Personal information</p>
      <p style={cardSub}>Update your display name.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Full name</label>
          <input type="text" {...register("name")} style={inputStyle(!!errors.name)} />
          <FieldError msg={errors.name?.message} />
        </div>
        <InlineError msg={error} />
        <InlineSuccess msg={success} />
        <button type="submit" disabled={isSubmitting} style={saveBtn(isSubmitting)}>
          {isSubmitting ? "Saving…" : "Save name"}
        </button>
      </form>
    </div>
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
    <div style={card}>
      <p style={cardTitle}>Change password</p>
      <p style={cardSub}>Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Current password</label>
          <input type="password" placeholder="••••••••" {...register("currentPassword")} style={inputStyle(!!errors.currentPassword)} />
          <FieldError msg={errors.currentPassword?.message} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>New password</label>
          <input type="password" placeholder="Min. 8 characters" {...register("newPassword")} style={inputStyle(!!errors.newPassword)} />
          <FieldError msg={errors.newPassword?.message} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Confirm new password</label>
          <input type="password" placeholder="Re-enter new password" {...register("confirm")} style={inputStyle(!!errors.confirm)} />
          <FieldError msg={errors.confirm?.message} />
        </div>
        <InlineError msg={error} />
        <InlineSuccess msg={success} />
        <button type="submit" disabled={isSubmitting} style={saveBtn(isSubmitting)}>
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

/* ── Avatar placeholder ───────────────────────────────────── */
function AvatarSection({ name, email }: { name: string; email: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={card}>
      <p style={cardTitle}>Profile photo</p>
      <p style={cardSub}>Upload a photo to personalise your account.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: "#1A3A5C",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A3A5C", marginBottom: 2 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#6B8FA8", marginBottom: 10 }}>{email}</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "#6B8FA8", background: "#F4F7FB",
            border: "1px dashed #D1DDE8", borderRadius: 8, padding: "6px 14px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="#9DC4E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Photo upload coming soon — Cloudflare R2 integration pending
          </div>
        </div>
      </div>
    </div>
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
    <div style={card}>
      <p style={cardTitle}>Two-factor authentication</p>
      <p style={cardSub}>Add an extra layer of security to your account.</p>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: on ? "#F0FDF4" : "#F7F9FC",
        border: `1px solid ${on ? "#86EFAC" : "#D1DDE8"}`,
        borderRadius: 10, padding: "16px 20px",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A3A5C", marginBottom: 2 }}>
            Email verification code
          </div>
          <div style={{ fontSize: 12, color: "#6B8FA8" }}>
            {on
              ? "A 6-digit code will be sent to your email on each login."
              : "Enable to receive a one-time code by email when you sign in."}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            flexShrink: 0,
            width: 48, height: 26, borderRadius: 13, border: "none",
            background: on ? "#1A3A5C" : "#D1DDE8",
            cursor: loading ? "not-allowed" : "pointer",
            position: "relative", transition: "background 0.2s",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <span style={{
            position: "absolute", top: 3,
            left: on ? 25 : 3,
            width: 20, height: 20, borderRadius: "50%",
            background: "#fff", transition: "left 0.2s",
          }} />
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <InlineError msg={error} />
        <InlineSuccess msg={success} />
      </div>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────── */
export function ProfileClient({
  name,
  email,
  twoFactorEnabled,
}: {
  name: string;
  email: string;
  twoFactorEnabled: boolean;
}) {
  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 22, color: "#1A3A5C", margin: "0 0 4px" }}>
        Account settings
      </h1>
      <p style={{ fontSize: 13, color: "#6B8FA8", margin: "0 0 28px" }}>
        Manage your profile and security preferences.
      </p>

      <AvatarSection name={name} email={email} />
      <NameSection initialName={name} />
      <PasswordSection />
      <TwoFactorSection enabled={twoFactorEnabled} />
    </div>
  );
}
