/**
 * Field-level encryption for sensitive PII data.
 * Uses AES-256-GCM with a per-field random IV.
 *
 * Requires ENCRYPTION_KEY env var (32-byte hex string).
 * Generate with: openssl rand -hex 32
 *
 * Format: iv:authTag:ciphertext (all base64)
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) return null;
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string. Returns encrypted string or original if no key configured.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext; // Graceful fallback — no key = no encryption

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `enc:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string. Returns decrypted plaintext or original if not encrypted.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith("enc:")) return ciphertext; // Not encrypted

  const key = getKey();
  if (!key) return ciphertext; // Can't decrypt without key

  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 4) return ciphertext;

    const iv = Buffer.from(parts[1], "base64");
    const authTag = Buffer.from(parts[2], "base64");
    const encrypted = parts[3];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    console.error("[encryption] Failed to decrypt value");
    return ciphertext;
  }
}

/**
 * Encrypt sensitive fields on an object. Returns a new object with encrypted values.
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value.length > 0) {
      (result as Record<string, unknown>)[field as string] = encrypt(value);
    }
  }
  return result;
}

/**
 * Decrypt sensitive fields on an object. Returns a new object with decrypted values.
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value.startsWith("enc:")) {
      (result as Record<string, unknown>)[field as string] = decrypt(value);
    }
  }
  return result;
}

/**
 * The PII fields that should be encrypted on Client records.
 */
export const CLIENT_PII_FIELDS = ["email", "phone"] as const;
