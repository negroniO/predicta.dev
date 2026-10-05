import { errorCategory, operationalLog } from "./operational-log";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public code: string, public status = 400, message = code, public retryAfter?: number) { super(message); }
}

export function adminSuccess(req: Request, path: string): NextResponse {
  if (req.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ ok: true, redirect: path }, { headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.redirect(new URL(path, process.env.NEXTAUTH_URL || req.url), 303);
}

export function apiError(error: unknown, operation: string): NextResponse {
  const requestId = randomUUID();
  let failure = error instanceof ApiError ? error : null;
  if (!failure && error && typeof error === "object" && "code" in error) {
    const code = error.code;
    if (code === "P2002") failure = new ApiError("already_exists", 409);
    if (code === "P2003" || code === "P2034") failure = new ApiError("resource_conflict", 409);
    if (code === "P2025") failure = new ApiError("not_found", 404);
  }
  if (!failure) {
    failure = new ApiError("server_error", 500, "The request could not be completed");
  }
  if (failure.status >= 500) operationalLog("error", "api_failure", { operation, requestId, status: failure.status, category: error instanceof ApiError ? "service_failure" : errorCategory(error) });
  return NextResponse.json({ ok: false, error: failure.code, message: failure.message, requestId }, {
    status: failure.status,
    headers: { "Cache-Control": "no-store", "X-Request-ID": requestId, ...(failure.retryAfter ? { "Retry-After": String(failure.retryAfter) } : {}) },
  });
}

export async function readBody(req: Request, maxBytes: number): Promise<Uint8Array> {
  if (Number(req.headers.get("content-length")) > maxBytes) throw new ApiError("body_too_large", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError("missing_body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError("body_too_large", 413); }
      chunks.push(value);
    }
    return new Uint8Array(Buffer.concat(chunks));
  } finally { reader.releaseLock(); }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new ApiError("unsupported_media_type", 415, "Use application/json");
  }
  const bytes = await readBody(req, 16 * 1024);
  let data: unknown;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError("invalid_json"); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new ApiError("invalid_body");
  return data as Record<string, unknown>;
}

export function textField(value: unknown, name: string, max: number, required = false): string {
  if (value === undefined || value === null) {
    if (required) throw new ApiError("invalid_field", 400, `${name} is required`);
    return "";
  }
  if (typeof value !== "string" || value.length > max || value.includes("\0")) throw new ApiError("invalid_field", 400, `Invalid ${name}`);
  const text = value.trim();
  if (required && !text) throw new ApiError("invalid_field", 400, `${name} is required`);
  return text;
}

export function positiveInt(value: string | null, fallback: number, max: number): number {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max) throw new ApiError("invalid_integer");
  return Number(value);
}

export function httpUrl(value: string, allowMailto = false): string {
  try {
    const url = new URL(value);
    if (!(["https:", "http:"].includes(url.protocol) || (allowMailto && url.protocol === "mailto:")) || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new ApiError("invalid_url"); }
}

export function referrerOrigin(value: unknown): string | null {
  const text = textField(value, "referrer", 2048);
  if (!text) return null;
  return new URL(httpUrl(text)).origin;
}
