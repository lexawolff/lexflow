import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return "";

  const secret = process.env.ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("ENCRYPTION_KEY não configurada.");
  }

  const key = crypto
    .createHash("sha256")
    .update(secret)
    .digest();

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}