import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function key(): Buffer {
  const raw = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("GOOGLE_CALENDAR_ENCRYPTION_KEY is not set");
  }
  // Accept a hex string exactly 64 chars (32 bytes), or a raw string
  // hashed to 32 bytes for convenience.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return Buffer.from(raw.slice(0, 32).padEnd(32, "x"), "utf8");
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

export function decryptToken(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}
