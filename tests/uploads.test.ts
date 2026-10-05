import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { MAX_COVER_BYTES, prepareCover, readAdminForm } from "../app/lib/uploads";

describe("cover uploads", () => {
  it.each(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "text/html"])("rejects non-image bytes advertised as %s", async (type) => {
    await expect(prepareCover(new File(['<svg onload="alert(1)">'], "cover", { type }))).rejects.toThrow("Use a PNG");
  });

  it("rejects truncated images, MIME mismatches and AVIF", async () => {
    await expect(prepareCover(new File([new Uint8Array([255, 216, 255])], "bad.jpg", { type: "image/jpeg" }))).rejects.toThrow("invalid");
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
    await expect(prepareCover(new File([new Uint8Array(png)], "fake.jpg", { type: "image/jpeg" }))).rejects.toThrow("matching file type");
    await expect(prepareCover(new File(["0000ftypavif"], "x.avif", { type: "image/avif" }))).rejects.toThrow("Use a PNG");
  });

  it("caps file size and decoded pixels", async () => {
    await expect(prepareCover(new File([new Uint8Array(MAX_COVER_BYTES + 1)], "large.png", { type: "image/png" }))).rejects.toThrow("5 MB");
    const png = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: "red" } }).png().toBuffer();
    await expect(prepareCover(new File([new Uint8Array(png)], "large.png", { type: "image/png" }))).rejects.toThrow("20 megapixel");
  });

  it("re-encodes to WebP and strips metadata and trailing payloads", async () => {
    const png = await sharp({ create: { width: 2800, height: 10, channels: 3, background: "red" } }).withMetadata().png().toBuffer();
    const image = new File([new Uint8Array(png), "<script>payload</script>"], "cover.png", { type: "image/png" });
    const result = await prepareCover(image);
    const metadata = await sharp(result).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(2400);
    expect(metadata.exif).toBeUndefined();
    expect(result.includes(Buffer.from("<script>"))).toBe(false);
  });

  it("caps streaming request bodies even without Content-Length", async () => {
    const req = new Request("http://localhost/upload", { method: "POST", body: new Uint8Array(8 * 1024 * 1024 + 1) });
    await expect(readAdminForm(req)).rejects.toMatchObject({ status: 413 });
  });

  it("reads multipart form data within the cap", async () => {
    const body = new FormData();
    body.set("title", "Test");
    const form = await readAdminForm(new Request("http://localhost/upload", { method: "POST", body }));
    expect(form.get("title")).toBe("Test");
  });
});
