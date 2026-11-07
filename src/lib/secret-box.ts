// Server only (API routes): never import this from a "use client" file.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Encrypts small secrets (store WiFi passwords) before they go into the database.
// AES-256-GCM with the key in ENCRYPTION_KEY: 32 random bytes, base64. The local .env.local and
// Coolify must use the SAME key, because both talk to the same database; with a different key the
// saved passwords can't be read. Losing the key means re-typing the passwords, nothing worse.

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64");
  return k;
}

export function hasEncryptionKey() {
  try { key(); return true; } catch { return false; }
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(stored: string): string {
  const [v, iv, tag, data] = stored.split(":");
  if (v !== "v1" || !iv || !tag || data === undefined) throw new Error("Unknown secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
