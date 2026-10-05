import { describe, it, expect } from "vitest";
import { analyticsRange } from "../app/lib/analytics";

describe("shared analytics date range", () => {
  it("uses 30 whole UTC days by default", () => {
    const { start, end } = analyticsRange(null, null, new Date("2026-10-05T14:00:00Z"));
    expect(start.toISOString()).toBe("2026-09-06T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-05T23:59:59.999Z");
  });
  it("swaps reversed ranges before rounding and caps at 90 days", () => {
    const { start, end } = analyticsRange("2026-10-05", "2025-01-01");
    expect(end.toISOString()).toBe("2026-10-05T23:59:59.999Z");
    expect(end.getTime() - start.getTime() + 1).toBe(90 * 86_400_000);
    expect(start.getUTCHours()).toBe(0);
  });
  it("recovers malformed dates identically for the page and CSV", () => {
    const { start, end } = analyticsRange("invalid", "invalid", new Date("2026-10-05T14:00:00Z"));
    expect(Number.isNaN(start.getTime())).toBe(false);
    expect(Number.isNaN(end.getTime())).toBe(false);
  });
});
