import { operationalLog } from "./operational-log";
import { ApiError, readBody } from "./api";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

export const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_FORM_BYTES = 8 * 1024 * 1024;

export class UploadError extends ApiError {
  constructor(message: string, status = 400) { super("invalid_upload", status, message); }
}

export async function readAdminForm(req: Request): Promise<FormData> {
  try {
    const bytes = await readBody(req, MAX_FORM_BYTES);
    return await new Response(new Uint8Array(bytes), { headers: req.headers }).formData();
  } catch (error) {
    if (error instanceof ApiError && error.status === 413) throw new UploadError("Request exceeds 8 MB", 413);
    throw new UploadError("Invalid form body");
  }
}

export async function prepareCover(file: File): Promise<Buffer> {
  if (!file.size || file.size > MAX_COVER_BYTES) throw new UploadError("Cover must be between 1 byte and 5 MB", 413);
  const buffer = Buffer.from(await file.arrayBuffer());
  const format = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png"
    : buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff ? "image/jpeg"
    : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" ? "image/webp"
    : null;
  // Reject SVG, HTML and AVIF before invoking an image decoder.
  if (!format || file.type !== format) throw new UploadError("Use a PNG, JPEG or WebP image with a matching file type");
  try {
    // Decode with a pixel limit and re-encode: remove metadata, trailing payloads
    // and animation instead of publishing the original uploaded bytes.
    return await sharp(buffer, { limitInputPixels: 20_000_000, failOn: "warning" })
      .rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer();
  } catch {
    throw new UploadError("Image is invalid or exceeds the 20 megapixel limit");
  }
}

function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new UploadError("Image storage is not configured", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from("project-images");
}

export async function uploadCover(file: File): Promise<{ url: string; path: string }> {
  const buffer = await prepareCover(file);
  const bucket = storage();
  const path = `covers/${randomUUID()}.webp`;
  const { error } = await bucket.upload(path, buffer, { contentType: "image/webp", upsert: false });
  if (error) throw new UploadError("Image upload failed", 502);
  return { path, url: bucket.getPublicUrl(path).data.publicUrl };
}

export async function removeNewCover(path: string): Promise<void> {
  try {
    const { error } = await storage().remove([path]);
    if (error) operationalLog("error", "cover_cleanup_failed");
  } catch {
    operationalLog("error", "cover_cleanup_failed");
  }
}
