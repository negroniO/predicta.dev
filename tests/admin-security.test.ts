import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), account: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/app/lib/prisma", () => ({ prisma: { account: { findFirst: mocks.account } } }));
import { authOptions } from "../app/lib/auth";
import { authorizeAdminRequest } from "../app/lib/admin";
import { isAdminGitHubId } from "../app/lib/admin-policy";

beforeEach(() => {
  vi.stubEnv("NEXTAUTH_URL", "https://predicta.dev");
  vi.stubEnv("ADMIN_GITHUB_IDS", "203515807");
  mocks.session.mockResolvedValue(null);
  mocks.account.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

describe("administrator identity and CSRF", () => {
  it("allows only the confirmed GitHub provider identity at sign in", async () => {
    const signIn = authOptions.callbacks!.signIn!;
    const attempt = (provider: string, providerAccountId: string) => signIn({
      user: { id: "local-user" }, account: { provider, providerAccountId, type: "oauth" },
    });
    expect(await attempt("github", "203515807")).toBe(true);
    expect(await attempt("github", "999999")).toBe(false);
    expect(await attempt("other", "203515807")).toBe(false);
  });

  it("fails closed for an empty or malformed allowlist", () => {
    vi.stubEnv("ADMIN_GITHUB_IDS", "");
    expect(isAdminGitHubId("203515807")).toBe(false);
    vi.stubEnv("ADMIN_GITHUB_IDS", "negroniO");
    expect(isAdminGitHubId("203515807")).toBe(false);
  });

  it("rejects sessions issued to non-admin users before the allowlist", async () => {
    mocks.session.mockResolvedValue({ user: { id: "old-user" } });
    const result = await authorizeAdminRequest(new Request("https://predicta.dev/api/admin/validate/slug"));
    expect(result?.status).toBe(403);
    expect(mocks.account).toHaveBeenCalledWith({
      where: { userId: "old-user", provider: "github", providerAccountId: { in: ["203515807"] } }, select: { id: true },
    });
  });

  it.each([null, "null", "https://attacker.test", "https://predicta.dev.attacker.test"])("rejects administrator POST with origin %s", async (origin) => {
    mocks.session.mockResolvedValue({ user: { id: "owner" } });
    mocks.account.mockResolvedValue({ id: "owner-account" });
    const headers = origin ? { origin } : undefined;
    const result = await authorizeAdminRequest(new Request("https://predicta.dev/api/admin/projects", { method: "POST", headers }));
    expect(result?.status).toBe(403);
  });

  it("accepts same-origin administrator mutations", async () => {
    mocks.session.mockResolvedValue({ user: { id: "owner" } });
    mocks.account.mockResolvedValue({ id: "owner-account" });
    const req = new Request("https://predicta.dev/api/admin/projects", { method: "POST", headers: { origin: "https://predicta.dev" } });
    expect(await authorizeAdminRequest(req)).toBeNull();
  });
});

describe("every privileged route rejects anonymous requests before work", () => {
  // Real handlers and real authorization helper. The restricted Prisma mock has
  // no mutation methods: reaching any business operation would fail this test.
  const routes = [
    ["projects", () => import("../app/api/admin/projects/route")],
    ["projects/example", () => import("../app/api/admin/projects/[slug]/route")],
    ["pages", () => import("../app/api/admin/pages/route")],
    ["pages/example", () => import("../app/api/admin/pages/[slug]/route")],
    ["categories", () => import("../app/api/admin/categories/route")],
    ["categories/1", () => import("../app/api/admin/categories/[id]/route")],
    ["upload/cover", () => import("../app/api/upload/cover/route")],
  ] as const;

  it.each(routes)("protects %s", async (path, load) => {
    const { POST } = await load();
    const result = await POST(new NextRequest(`https://predicta.dev/api/admin/${path}`, { method: "POST" }), { params: Promise.resolve({ slug: "example", id: "1" }) });
    expect(result.status).toBe(401);
  });

  it.each([
    ["export", () => import("../app/api/admin/analytics/export/route")],
    ["validation", () => import("../app/api/admin/validate/slug/route")],
  ] as const)("protects read-only %s", async (_name, load) => {
    const { GET } = await load();
    expect((await GET(new NextRequest("https://predicta.dev/api/admin/read"))).status).toBe(401);
  });
});
