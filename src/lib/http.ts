import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/db";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED",
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  // Next can reconstruct req.url using an internal localhost hostname.
  // Compare against the browser-facing Host and scheme instead.
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const scheme =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    url.protocol.slice(0, -1);
  const expected = scheme + "://" + host;
  if (
    !origin ||
    !["http", "https"].includes(scheme) ||
    origin !== expected ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "This request must come from your workspace.");
}
export async function readJson(
  req: Request,
  limit = 2 * 1024 * 1024,
): Promise<unknown> {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Send JSON data.");
  if (Number(req.headers.get("content-length")) > limit)
    throw new HttpError(413, "This request is too large.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "No request data received.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      throw new HttpError(413, "This request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "This request contains invalid JSON.");
  }
}
export async function rateLimit(
  req: Request,
  action: string,
  max: number,
  windowMs: number,
  userId?: string,
) {
  // Only Cloudflare's trusted IP header is used on Workers. Local requests share a bucket.
  const ip =
    process.env.WHICHCVFITS_TARGET === "cloudflare"
      ? req.headers.get("cf-connecting-ip") || "unknown"
      : "local";
  const key =
    action + ":" + (userId || ip) + ":" + Math.floor(Date.now() / windowMs);
  const db = await getDatabase();
  const row = await db.get<{ hits: number }>(
    "INSERT INTO rate_limits (bucket,hits,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits",
    [key, Date.now() + windowMs],
  );
  if ((row?.hits || 0) > max)
    throw new HttpError(
      429,
      "Too many attempts. Please wait a few minutes and try again.",
      "RATE_LIMITED",
    );
  await db.run("DELETE FROM rate_limits WHERE expires_at < ?", [Date.now()]);
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message, code: error.code }, error.status);
  if (error instanceof z.ZodError)
    return json(
      {
        error: error.issues[0]?.message || "Check the form values.",
        code: "VALIDATION_ERROR",
      },
      400,
    );
  // Never reflect raw database, provider, or credential errors to the browser.
  return json(
    {
      error:
        "Something went wrong. Please try again. If it continues, check the local setup.",
      code: "SERVER_ERROR",
    },
    500,
  );
}
