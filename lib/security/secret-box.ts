import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTION_PREFIX = "enc:v1";

function getEncryptionKey() {
  const source = process.env.APP_ENCRYPTION_KEY;
  if (!source) {
    throw new Error("APP_ENCRYPTION_KEY is required for secret encryption");
  }

  return createHash("sha256").update(source).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url")
  ].join(":");
}

export function decryptSecret(value: string) {
  if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    return value;
  }

  const [, , ivEncoded, authTagEncoded, ciphertextEncoded] = value.split(":");
  if (!ivEncoded || !authTagEncoded || !ciphertextEncoded) {
    throw new Error("Invalid encrypted secret payload");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivEncoded, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTagEncoded, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
