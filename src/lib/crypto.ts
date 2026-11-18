import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from "crypto";

const ALGORITHM =
  "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const encoded =
    process.env.APP_ENCRYPTION_KEY;

  if (!encoded) {
    throw new Error(
      "APP_ENCRYPTION_KEY não configurada.",
    );
  }

  const key =
    Buffer.from(
      encoded,
      "base64",
    );

  if (key.length !== 32) {
    throw new Error(
      "APP_ENCRYPTION_KEY deve possuir exatamente 32 bytes.",
    );
  }

  return key;
}

/*
 * Código determinístico que não revela o valor sem a chave. Cada finalidade
 * usa uma chave derivada própria.
 */
export function keyedHash(
  purpose: string,
  value: string,
): string {
  const key =
    Buffer.from(
      hkdfSync(
        "sha256",
        getEncryptionKey(),
        Buffer.alloc(0),
        `lexflow:${purpose}`,
        32,
      ),
    );

  return createHmac(
    "sha256",
    key,
  )
    .update(
      value,
      "utf8",
    )
    .digest("hex");
}

export function encryptSecret(
  value: string,
): string {
  const key =
    getEncryptionKey();

  const iv =
    randomBytes(12);

  const cipher =
    createCipheriv(
      ALGORITHM,
      key,
      iv,
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        value,
        "utf8",
      ),
      cipher.final(),
    ]);

  const tag =
    cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptSecret(
  value: string,
): string {
  const [
    version,
    ivEncoded,
    tagEncoded,
    encryptedEncoded,
  ] =
    value.split(".");

  if (
    version !== "v1" ||
    !ivEncoded ||
    !tagEncoded ||
    !encryptedEncoded
  ) {
    throw new Error(
      "Segredo criptografado inválido.",
    );
  }

  const key =
    getEncryptionKey();

  const iv =
    Buffer.from(
      ivEncoded,
      "base64",
    );

  const tag =
    Buffer.from(
      tagEncoded,
      "base64",
    );

  const encrypted =
    Buffer.from(
      encryptedEncoded,
      "base64",
    );

  const decipher =
    createDecipheriv(
      ALGORITHM,
      key,
      iv,
    );

  decipher.setAuthTag(
    tag,
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        encrypted,
      ),
      decipher.final(),
    ]);

  return decrypted.toString(
    "utf8",
  );
}