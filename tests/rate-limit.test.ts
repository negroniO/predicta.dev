import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryLimiter } from "../app/lib/rate-limit-store";

const mock = vi.hoisted(() => ({ eval: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), on: vi.fn() }));
vi.mock("ioredis", () => ({ default: class { eval = mock.eval; connect = mock.connect; disconnect = mock.disconnect; on = mock.on; } }));

beforeEach(() => { vi.resetModules(); mock.connect.mockResolvedValue(undefined); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("rate limiting", () => {
  it("counts attempts and permits requests after expiry", () => {
    let now = 0;
    const consume = createMemoryLimiter(10, () => now);
    expect(consume("client", 2, 60).allowed).toBe(true);
    expect(consume("client", 2, 60).allowed).toBe(true);
    expect(consume("client", 2, 60)).toEqual({ allowed: false, retryAfter: 60 });
    now = 60_000;
    expect(consume("client", 2, 60).allowed).toBe(true);
  });
  it("bounds memory without evicting active limits", () => {
    const consume = createMemoryLimiter(1, () => 0);
    consume("a", 1, 60);
    expect(consume("b", 1, 60).allowed).toBe(false);
    expect(consume("a", 1, 60).allowed).toBe(false);
  });
  it("ignores client-supplied forwarding headers unless explicitly configured", async () => {
    vi.stubEnv("RATE_LIMIT_IP_HEADER", "");
    const { rateLimitIdentity } = await import("../app/lib/rateLimit");
    const first = new Request("https://example.test", { headers: { "x-forwarded-for": "192.0.2.1" } });
    const second = new Request("https://example.test", { headers: { "x-forwarded-for": "192.0.2.2" } });
    expect(rateLimitIdentity(first)).toBe(rateLimitIdentity(second));
    vi.stubEnv("RATE_LIMIT_IP_HEADER", "x-forwarded-for");
    expect(rateLimitIdentity(first)).not.toBe(rateLimitIdentity(second));
    expect(rateLimitIdentity(first)).not.toContain("192.0.2");
  });
  it("fails closed in production when Redis is missing", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("RATE_LIMIT_BACKEND", ""); vi.stubEnv("REDIS_URL", "");
    const { rateLimit } = await import("../app/lib/rateLimit");
    await expect(rateLimit("test", 1, 60)).rejects.toMatchObject({ status: 503, retryAfter: 30 });
  });
  it("uses a single Redis operation with expiry and shares a lazy connection", async () => {
    vi.stubEnv("RATE_LIMIT_BACKEND", "redis"); vi.stubEnv("REDIS_URL", "redis://localhost:56380");
    mock.eval.mockResolvedValue([2, 1200]);
    const { rateLimit } = await import("../app/lib/rateLimit");
    expect(await rateLimit("test", 1, 60)).toEqual({ allowed: false, retryAfter: 2 });
    await rateLimit("second", 1, 60);
    expect(mock.connect).toHaveBeenCalledTimes(1);
    expect(mock.eval.mock.calls[0][0]).toContain("PEXPIRE");
  });
  it("returns 503 on Redis failure and backs off instead of falling open", async () => {
    vi.stubEnv("RATE_LIMIT_BACKEND", "redis"); vi.stubEnv("REDIS_URL", "redis://localhost:56380");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mock.eval.mockRejectedValue(new Error("connection lost"));
    const { rateLimit } = await import("../app/lib/rateLimit");
    await expect(rateLimit("test", 1, 60)).rejects.toMatchObject({ status: 503 });
    await expect(rateLimit("test", 1, 60)).rejects.toMatchObject({ status: 503 });
    expect(mock.eval).toHaveBeenCalledTimes(1);
  });
});
