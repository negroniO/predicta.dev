import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ updateMany: vi.fn(), deleteMany: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("@/app/lib/admin", () => ({ authorizeAdminRequest: async () => null }));
vi.mock("@/app/lib/prisma", () => ({ prisma: { project: { updateMany: mocks.updateMany, deleteMany: mocks.deleteMany } } }));
vi.mock("@/app/lib/uploads", async (original) => ({
  ...await original<typeof import("../app/lib/uploads")>(), uploadCover: mocks.upload, removeNewCover: mocks.remove,
}));
import { POST } from "../app/api/admin/projects/[slug]/route";
import { parseProjectInput } from "../app/lib/project-input";

const version = "2026-10-03T10:00:00.000Z";
function submit(fields: Record<string, string>, file?: File) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  if (file) body.set("coverImage", file);
  return POST(new NextRequest("https://predicta.dev/api/admin/projects/example", { method: "POST", body }), { params: Promise.resolve({ slug: "example" }) });
}

beforeEach(() => {
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.deleteMany.mockResolvedValue({ count: 1 });
  mocks.upload.mockResolvedValue({ path: "covers/new.webp", url: "https://storage.test/new.webp" });
  mocks.remove.mockResolvedValue(undefined);
});

describe("project mutations", () => {
  it.each([
    ["feature", { featured: "true" }, { featured: true }],
    ["reorder", { sortOrder: "7" }, { sortOrder: 7 }],
  ] as const)("%s cannot overwrite other fields from a stale form", async (action, values, expected) => {
    const result = await submit({ _action: action, updatedAt: version, title: "stale", content: "stale", category: "99", status: "Draft", ...values });
    expect(result.status).toBe(303);
    expect(mocks.updateMany).toHaveBeenCalledWith({ where: { slug: "example", updatedAt: new Date(version) }, data: expected });
  });

  it.each(["feature", "reorder", "update", "delete"])("rejects a stale %s", async (action) => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    const result = await submit({ _action: action, updatedAt: version, title: "Valid", slug: "example", featured: "true", sortOrder: "2" });
    expect(result.status).toBe(409);
  });

  it("requires the version before deleting", async () => {
    expect((await submit({ _action: "delete" })).status).toBe(400);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it.each(["NaN", "1e3", "-1", "9007199254740993"])("rejects invalid sort order %s", async (sortOrder) => {
    expect((await submit({ _action: "reorder", updatedAt: version, sortOrder })).status).toBe(400);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("cleans up only the newly uploaded object on a conflict", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const result = await submit({ title: "Valid", slug: "example", updatedAt: version }, new File(["mock"], "cover.png", { type: "image/png" }));
    expect(result.status).toBe(409);
    expect(mocks.remove).toHaveBeenCalledTimes(1);
    expect(mocks.remove).toHaveBeenCalledWith("covers/new.webp");
  });

  it("validates fields before an upload", async () => {
    const result = await submit({ title: "", slug: "example", updatedAt: version }, new File(["mock"], "cover.png", { type: "image/png" }));
    expect(result.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it.each(["javascript:alert(1)", "data:text/html,test", "https://user:password@example.com"])("rejects unsafe project URL %s", (liveUrl) => {
    const body = new FormData();
    Object.entries({ title: "Test", slug: "test", liveUrl }).forEach(([key, value]) => body.set(key, value));
    expect(() => parseProjectInput(body)).toThrow("Invalid project URL");
  });
});
