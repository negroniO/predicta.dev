export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function parseIntOr(
  input: string | null | undefined,
  fallback: number
): number {
  if (!input) return fallback;
  const n = parseInt(input, 10);
  return Number.isNaN(n) ? fallback : n;
}

export function splitCsv(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function clampDateRange(
  start: Date,
  end: Date,
  maxDays = 90
): { start: Date; end: Date } {
  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }
  const maxMs = maxDays * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > maxMs) {
    start = new Date(end.getTime() - maxMs);
  }
  return { start, end };
}
