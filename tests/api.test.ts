import { describe, it, expect, vi } from "vitest";
import { adminSuccess, ApiError, apiError, readJson, textField, positiveInt, referrerOrigin } from "../app/lib/api";
import { pageInput, categoryInput } from "../app/lib/admin-input";

function json(body: string, contentType = "application/json") {
  return new Request("https://example.test/api", { method: "POST", headers: { "content-type": contentType }, body });
}

describe("API input and errors", () => {
  it.each(["null", "[]", "42", '"text"', "{"])("rejects non-object or malformed JSON %s", async (body) => {
    await expect(readJson(json(body))).rejects.toMatchObject({ status: 400 });
  });
  it("caps the actual request body without trusting Content-Length", async () => {
    await expect(readJson(json(JSON.stringify({ text: "x".repeat(17000) })))).rejects.toMatchObject({ status: 413 });
  });
  it("requires JSON and accepts charset parameters", async () => {
    await expect(readJson(json("{}", "text/plain"))).rejects.toMatchObject({ status: 415 });
    await expect(readJson(json('{"name":"Test"}', "application/json; charset=utf-8"))).resolves.toEqual({ name: "Test" });
  });
  it.each([{}, [], 3, true, "x".repeat(11), "bad\0value"])("rejects invalid text %j", (value) => {
    expect(() => textField(value, "name", 10)).toThrow(ApiError);
  });
  it.each(["NaN", "1e3", "0", "-1", "1.5", "101"])("rejects invalid pagination %s", (value) => {
    expect(() => positiveInt(value, 20, 100)).toThrow(ApiError);
  });
  it("removes referrer path, query and fragment", () => {
    expect(referrerOrigin("https://example.com/private?q=token#secret")).toBe("https://example.com");
    expect(() => referrerOrigin("https://user:pass@example.com")).toThrow();
  });
  it("returns stable errors and correlation IDs without leaking exceptions", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = apiError(new Error("database-password-must-not-leak"), "test_operation");
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body).toMatchObject({ ok: false, error: "server_error" });
      expect(body.requestId).toMatch(/^[a-f0-9-]{36}$/);
      expect(JSON.stringify(body) + JSON.stringify(log.mock.calls)).not.toContain("database-password");
    } finally { log.mockRestore(); }
  });
  it.each([["P2002", 409], ["P2003", 409], ["P2034", 409], ["P2025", 404]] as const)("maps database error %s", (code, status) => {
    expect(apiError({ code }, "test").status).toBe(status);
  });
  it("validates multipart fields as strictly as JSON", () => {
    const form = new FormData();
    form.set("title", new File(["bad"], "title.txt")); form.set("slug", "valid");
    expect(() => pageInput(form)).toThrow();
    form.set("name", "Test"); form.set("sortOrder", "1abc");
    expect(() => categoryInput(form)).toThrow();
  });
  it("prevents published pages from shadowing reserved routes", () => {
    const form = new FormData();
    form.set("title", "Test"); form.set("slug", "admin");
    expect(() => pageInput(form)).toThrow("reserved_slug");
  });
});


describe("administrator success responses", () => {
  it("acknowledges enhanced forms without fetching the destination page", async () => {
    const response = adminSuccess(new Request("https://example.test/api", { headers: { accept: "application/json" } }), "/admin?created=1");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, redirect: "/admin?created=1" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("retains native form redirects to the configured site origin", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://example.test");
    try {
      const response = adminSuccess(new Request("http://internal:3000/api"), "/admin?created=1");
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("https://example.test/admin?created=1");
    } finally { vi.unstubAllEnvs(); }
  });
});
