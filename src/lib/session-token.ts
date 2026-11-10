import { requireSecret } from "./crypto.ts";
const encoder = new TextEncoder();
export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  exp: number;
}
async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(requireSecret("WHICHCVFITS_JWT_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function signToken(payload: SessionPayload): Promise<string> {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    encoder.encode(data),
  );
  return data + "." + Buffer.from(signature).toString("base64url");
}
export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    if (token.length > 4096 || token.split(".").length !== 2) return null;
    const [data, signature] = token.split(".");
    if (
      !/^[A-Za-z0-9_-]+$/.test(data) ||
      !/^[A-Za-z0-9_-]{43}$/.test(signature)
    )
      return null;
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        await signingKey(),
        Buffer.from(signature, "base64url"),
        encoder.encode(data),
      ))
    )
      return null;
    const p = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (
      typeof p.userId !== "string" ||
      !p.userId ||
      typeof p.email !== "string" ||
      typeof p.name !== "string" ||
      typeof p.exp !== "number" ||
      !Number.isFinite(p.exp) ||
      p.exp <= Date.now() ||
      p.exp > Date.now() + 7 * 86400000 + 60000
    )
      return null;
    return p;
  } catch {
    return null;
  }
}
