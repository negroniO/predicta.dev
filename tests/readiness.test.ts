import { afterEach, describe, expect, it, vi } from "vitest";
import { createReadinessProbe } from "../app/lib/readiness";
import { errorCategory, operationalLog } from "../app/lib/operational-log";
import { apiError, ApiError } from "../app/lib/api";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("bounded readiness", () => {
  it("coalesces concurrent checks and caches successes", async () => {
    const database = vi.fn(async () => {}), rateLimit = vi.fn(async () => {}), changed = vi.fn();
    const probe = createReadinessProbe({ database, rateLimit }, changed);
    const results = await Promise.all(Array.from({ length: 30 }, probe));
    expect(results.every(value => value.ready)).toBe(true);
    await probe();
    expect(database).toHaveBeenCalledTimes(1);
    expect(rateLimit).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledTimes(1);
  });
  it("reports dependency failures and recovery without logging each poll", async () => {
    let now = 0;
    const database = vi.fn().mockRejectedValueOnce(new Error("private")).mockResolvedValue(undefined);
    const changed = vi.fn();
    const probe = createReadinessProbe({ database, rateLimit: async () => {} }, changed, { now: () => now });
    expect(await probe()).toEqual({ ready: false, database: false, rateLimit: true });
    await probe();
    now = 6000;
    expect((await probe()).ready).toBe(true);
    expect(changed).toHaveBeenCalledTimes(2);
    now = 12000;
    await probe();
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it("bounds responses and retains one in-flight probe until hung work settles", async () => {
    vi.useFakeTimers();
    let complete!: () => void;
    const database = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    const probe = createReadinessProbe({ database, rateLimit: async () => {} }, () => {});
    const pending = probe();
    await vi.advanceTimersByTimeAsync(2501);
    expect((await pending).ready).toBe(false);
    await vi.advanceTimersByTimeAsync(10000);
    expect((await probe()).ready).toBe(false);
    expect(database).toHaveBeenCalledTimes(1);
    complete();
    await vi.advanceTimersByTimeAsync(1);
    const next = probe();
    await vi.advanceTimersByTimeAsync(2501);
    expect((await next).ready).toBe(false);
    expect(database).toHaveBeenCalledTimes(2);
    complete();
  });
});

describe("operational logs", () => {
  it("correlates service failures with the returned request ID", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = apiError(new ApiError("invalid_upload", 503, "Storage unavailable"), "cover_upload");
    const body = await response.json();
    const entry = JSON.parse(log.mock.calls[0][0]);
    expect(entry).toMatchObject({ event: "api_failure", operation: "cover_upload", status: 503, requestId: body.requestId });
    expect(response.headers.get("x-request-id")).toBe(body.requestId);
  });
  it("excludes unknown fields and unsafe labels", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fields = { operation: "https://secret.example/password", requestId: "user-controlled", password: "private-secret" };
    operationalLog("error", "auth_failure", fields);
    expect(log.mock.calls[0][0]).not.toMatch(/secret|password|user-controlled/);
  });
  it("classifies known database failures without including messages", () => {
    expect(errorCategory({ code: "P1001", message: "sensitive" })).toBe("database_unavailable");
    expect(errorCategory({ code: "P2021" })).toBe("database_schema");
    expect(errorCategory(new Error("private"))).toBe("unexpected");
  });
});
