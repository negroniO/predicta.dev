import { ApiError, textField, positiveInt } from "./api";
import { isValidSlug, normalizeSlug } from "./validation";

export function formText(form: FormData, name: string, max = 2000, required = false) {
  return textField(form.get(name), name, max, required);
}

function slugField(form: FormData) {
  const slug = normalizeSlug(formText(form, "slug", 160, true));
  if (!isValidSlug(slug)) throw new ApiError("invalid_slug");
  return slug;
}

export function pageInput(form: FormData) {
  const slug = slugField(form);
  if (["admin", "api", "projects", "rss", "atom"].includes(slug)) throw new ApiError("reserved_slug");
  const status = formText(form, "status", 20) || "draft";
  if (!["draft", "published"].includes(status)) throw new ApiError("invalid_status");
  return { slug, title: formText(form, "title", 240, true), status,
    content: formText(form, "content", 1_000_000) || null, excerpt: formText(form, "excerpt", 2000) || null };
}

export function categoryInput(form: FormData) {
  const order = formText(form, "sortOrder", 12);
  return { slug: slugField(form), name: formText(form, "name", 160, true),
    sortOrder: order === "0" || order === "" ? 0 : positiveInt(order, 0, 2_000_000_000) };
}

export function recordVersion(form: FormData): Date {
  const value = formText(form, "updatedAt", 40, true);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError("invalid_version");
  return date;
}
