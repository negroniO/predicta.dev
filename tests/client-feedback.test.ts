import { describe, expect, it } from "vitest";
import { responseMessage } from "../app/lib/client-feedback";

describe("recoverable client feedback", () => {
  it("explains stale edits without telling the user to discard them", async () => {
    const response = Response.json({ error: "stale_record" }, { status: 409 });
    expect(await responseMessage(response, "fallback")).toContain("another tab");
  });
  it.each([429, 503])("uses retry timing for %i", async (status) => {
    expect(await responseMessage(new Response(null, { status, headers: { "Retry-After": "30" } }), "fallback")).toContain("30 seconds");
  });
  it("never exposes raw server failures", async () => {
    expect(await responseMessage(Response.json({ message: "secret details" }, { status: 500 }), "Try again")).toBe("Try again");
  });
  it("does not display machine codes or invalid JSON", async () => {
    expect(await responseMessage(Response.json({ message: "invalid_json", error: "invalid_json" }, { status: 400 }), "Try again")).toBe("Try again");
    expect(await responseMessage(new Response("broken", { status: 400 }), "Try again")).toBe("Try again");
  });
  it("provides recovery instructions for expired sessions", async () => {
    expect(await responseMessage(new Response(null, { status: 401 }), "fallback")).toContain("Sign in again in another tab");
  });
});
