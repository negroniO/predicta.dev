import { ApiError } from "./api";
import { isValidSlug, normalizeSlug, splitCsv } from "./validation";

export class ProjectInputError extends ApiError {
  constructor(message: string) { super("invalid_project", 400, message); }
}

function field(body: FormData, name: string, max = 2000): string {
  const value = body.get(name);
  if (value === null) return "";
  if (typeof value !== "string" || value.length > max) throw new ProjectInputError(`Invalid ${name}`);
  return value.trim();
}

function integer(value: string, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  if (!/^-?\d+$/.test(value)) throw new ProjectInputError("Invalid integer");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new ProjectInputError("Integer out of range");
  return number;
}

function webUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new ProjectInputError("Invalid project URL"); }
}

export function parseProjectInput(body: FormData) {
  const title = field(body, "title", 240);
  const slug = normalizeSlug(field(body, "slug", 160));
  if (!title || !isValidSlug(slug)) throw new ProjectInputError("Title and slug are required");
  const status = field(body, "status", 30) || "Draft";
  if (!["Draft", "Completed", "In Progress"].includes(status)) throw new ProjectInputError("Invalid status");
  const category = field(body, "category", 20);
  return {
    title, slug, status,
    subtitle: field(body, "subtitle", 1000) || null,
    description: field(body, "description", 20_000),
    content: field(body, "content", 1_000_000) || null,
    year: integer(field(body, "year", 10), new Date().getFullYear(), 1900, 2200),
    sortOrder: integer(field(body, "sortOrder", 12), 999, 0, 2_000_000_000),
    categoryId: category ? integer(category, 0, 1, 2_000_000_000) : null,
    tags: splitCsv(field(body, "tags", 4000)),
    techStack: splitCsv(field(body, "techStack", 4000)),
    githubUrl: webUrl(field(body, "githubUrl")),
    liveUrl: webUrl(field(body, "liveUrl")),
    featured: body.get("featured") !== null,
  };
}

export function expectedProjectVersion(body: FormData): Date {
  const value = field(body, "updatedAt", 40);
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new ProjectInputError("Reload the project before saving");
  return date;
}
