import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  const secret = process.env.ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("ENCRYPTION_KEY não configurada.");
  }

  const key = crypto
    .createHash("sha256")
    .update(secret)
    .digest();

  const [ivHex, tagHex, encryptedHex] = encryptedText.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Texto criptografado inválido.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}