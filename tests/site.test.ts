import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "../app/lib/site";

describe("public site origin", () => {
  it("defaults share and metadata URLs to production", () => {
    expect(resolveSiteUrl()).toBe("https://predicta.dev");
  });
  it("uses one normalized origin and accepts the legacy setting as fallback", () => {
    expect(resolveSiteUrl("https://preview.example/path/", "https://legacy.example")).toBe("https://preview.example");
    expect(resolveSiteUrl("", "https://legacy.example/")).toBe("https://legacy.example");
    expect(resolveSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });
  it.each(["javascript:alert(1)", "ftp://example.com", "https://user:password@example.com"])("rejects unsafe configuration %s", (value) => {
    expect(() => resolveSiteUrl(value)).toThrow();
  });
});
