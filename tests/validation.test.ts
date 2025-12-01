/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import {
  normalizeSlug,
  isValidSlug,
  parseIntOr,
  splitCsv,
  clampDateRange,
} from "../app/lib/validation";

describe("validation helpers", () => {
  it("normalizes and validates slugs", () => {
    expect(normalizeSlug(" Hello World ")).toBe("hello-world");
    expect(normalizeSlug("ML & Data")).toBe("ml-data");
    expect(isValidSlug("ok-slug")).toBe(true);
    expect(isValidSlug("Bad Slug")).toBe(false);
    expect(isValidSlug("bad/slug")).toBe(false);
  });

  it("parses ints safely", () => {
    expect(parseIntOr("123", 0)).toBe(123);
    expect(parseIntOr("abc", 5)).toBe(5);
    expect(parseIntOr(null, 7)).toBe(7);
  });

  it("splits CSV strings", () => {
    expect(splitCsv("a, b, ,c")).toEqual(["a", "b", "c"]);
    expect(splitCsv("")).toEqual([]);
    expect(splitCsv(null)).toEqual([]);
  });

  it("clamps date ranges to max days and swaps if reversed", () => {
    const end = new Date("2024-02-01T00:00:00Z");
    const start = new Date("2023-10-01T00:00:00Z");
    const { start: s, end: e } = clampDateRange(start, end, 90);
    expect(e.getTime()).toBe(end.getTime());
    expect(e.getTime() - s.getTime()).toBeLessThanOrEqual(90 * 24 * 60 * 60 * 1000);

    const reversed = clampDateRange(end, start, 90);
    expect(reversed.end.getTime()).toBe(end.getTime());
    expect(reversed.start.getTime()).toBeLessThan(reversed.end.getTime());
  });
});
