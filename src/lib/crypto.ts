/**
 * Edge-compatible Web Crypto API (crypto.subtle) encryption for BYOK API keys
 * and password hashing. Works identically in Node.js 22 and Cloudflare Workers.
 */

export function requireSecret(
  name: "WHICHCVFITS_ENCRYPTION_SECRET" | "WHICHCVFITS_JWT_SECRET",
): string {
  const value = process.env[name];
  if (!value || value.length < 32)
    throw new Error(
      "Server secrets are not configured. Run npm run setup locally.",
    );
  if (
    process.env.WHICHCVFITS_ENCRYPTION_SECRET ===
    process.env.WHICHCVFITS_JWT_SECRET
  )
    throw new Error("Signing and encryption secrets must be different.");
  return value;
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex))
    throw new Error("Invalid encrypted data.");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function getMasterAesKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawMaterial = encoder.encode(
    requireSecret("WHICHCVFITS_ENCRYPTION_SECRET"),
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", rawMaterial);
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptApiKey(plainKey: string): Promise<{
  encryptedKey: string;
  iv: string;
  keyHint: string;
}> {
  const trimmed = plainKey.trim();
  const key = await getMasterAesKey();
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encoder.encode(trimmed),
  );

  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  const keyHint =
    trimmed.length > 10 ? `${prefix}••••••••${suffix}` : `${prefix}••••`;

  return {
    encryptedKey: bufferToHex(cipherBuffer),
    iv: bufferToHex(ivBytes),
    keyHint,
  };
}

export async function decryptApiKey(
  encryptedHex: string,
  ivHex: string,
): Promise<string> {
  const key = await getMasterAesKey();
  const ivBytes = hexToBytes(ivHex);
  const cipherBytes = hexToBytes(encryptedHex);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes as BufferSource },
    key,
    cipherBytes as BufferSource,
  );

  const decoder = new TextDecoder();
  return decoder.decode(plainBuffer);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return `${bufferToHex(salt)}:${bufferToHex(derivedBits)}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  if (
    !saltHex ||
    !hashHex ||
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !/^[0-9a-f]{64}$/i.test(hashHex) ||
    storedHash.split(":").length !== 2
  )
    return false;

  const encoder = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  const expected = hexToBytes(hashHex);
  const actual = new Uint8Array(derivedBits);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}
