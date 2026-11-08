// Server only (API routes): turns a validated equipment form into database columns,
// encrypting the remote access secrets.
import type { EquipmentInput } from "@/lib/equipment";
import { encryptSecret, hasEncryptionKey } from "@/lib/secret-box";

export class MissingKeyError extends Error {
  constructor() { super("Passwords can't be saved yet: ENCRYPTION_KEY isn't set on the server"); }
}

// undefined = keep the saved value, "" or null = clear it, text = encrypt and save
function secret(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (!v) return null;
  if (!hasEncryptionKey()) throw new MissingKeyError();
  return encryptSecret(v);
}

export function equipmentColumns(data: EquipmentInput) {
  const { remotePassword, remotePin, windowsPassword, ...plain } = data;
  const remoteAccountPasswordEnc = secret(remotePassword);
  const remotePinEnc = secret(remotePin);
  const windowsPasswordEnc = secret(windowsPassword);
  return {
    ...plain,
    ...(remoteAccountPasswordEnc !== undefined ? { remoteAccountPasswordEnc } : {}),
    ...(remotePinEnc !== undefined ? { remotePinEnc } : {}),
    ...(windowsPasswordEnc !== undefined ? { windowsPasswordEnc } : {}),
  };
}
