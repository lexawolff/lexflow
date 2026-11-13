import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const TAG_LENGTH = 16;

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("ENCRYPTION_KEY não configurada.");

  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Texto criptografado inválido.");
  const [ivHex, tagHex, encryptedHex] = parts;

  if (!ivHex || !/^[a-f0-9]{32}$/i.test(ivHex) ||
      !tagHex || !/^[a-f0-9]{32}$/i.test(tagHex) ||
      !encryptedHex || !/^(?:[a-f0-9]{2})+$/i.test(encryptedHex)) {
    throw new Error("Texto criptografado inválido.");
  }

  const key = crypto.createHash("sha256").update(secret).digest();
  const decipher = crypto.createDecipheriv(
    ALGORITHM, key, Buffer.from(ivHex, "hex"),
    { authTagLength: TAG_LENGTH },
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  // Nunca retornar a saída de update antes de final autenticar o conteúdo.
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
