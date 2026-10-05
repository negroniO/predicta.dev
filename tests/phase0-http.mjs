// Run against a built local app and a disposable, migrated PostgreSQL database.
// Both this script and the app must use the same explicit DATABASE_URL.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import seedTools from "../prisma/seed.cjs";

const database = new URL(process.env.DATABASE_URL);
const base = new URL(process.env.PHASE0_TEST_BASE_URL || "http://127.0.0.1:3107");
assert(["localhost", "127.0.0.1", "[::1]"].includes(database.hostname));
assert(/^\/predicta_(?:phase0(?:_clean)?|test)$/.test(database.pathname));
assert(!database.searchParams.has("host"));
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname));
assert.equal(base.protocol, "http:");

const prisma = new PrismaClient();
const suffix = randomUUID().slice(0, 8);
const publicSlug = `public-${suffix}`;
const draftSlug = `private-${suffix}`;
const unknownSlug = `unknown-${suffix}`;
const publicPage = `page-${suffix}`;
const draftPage = `secret-page-${suffix}`;
const ownerId = `owner-${suffix}`;
const outsiderId = `outsider-${suffix}`;
const ownerToken = randomUUID();
const outsiderToken = randomUUID();
const cookie = (token) => ({ cookie: `next-auth.session-token=${token}` });
let checks = 0;
async function request(path, expectedStatus, options = {}) {
  const response = await fetch(new URL(path, base), { redirect: "manual", ...options });
  assert.equal(response.status, expectedStatus, `${options.method || "GET"} ${path}`);
  checks++;
  return response;
}
const mutation = (fields, token = ownerToken, origin = base.origin) => ({
  method: "POST", headers: { ...cookie(token), origin }, body: new URLSearchParams(fields),
});

try {
  for (const [slug, status] of [[publicSlug, "Completed"], [draftSlug, "Draft"], [unknownSlug, "Unknown"]]) {
    const fixture = await prisma.project.create({ data: {
      slug, title: `${slug} & <Finance> ]]>`, description: "Local security fixture", content: "## Safe content", year: 2026,
      status, featured: true, sortOrder: 0, tags: [suffix], techStack: [],
    } });
    if (slug === publicSlug) await prisma.projectView.create({ data: {
      projectId: fixture.id, path: '=HYPERLINK("https://example.com","test")', referrer: 'bad, "address"\nsecond line',
    } });
  }
  await prisma.page.createMany({ data: [
    { slug: publicPage, title: publicPage, status: "published", content: "Published fixture" },
    { slug: draftPage, title: draftPage, status: "draft", content: "Secret fixture" },
  ] });
  for (const [id, providerAccountId, sessionToken] of [[ownerId, "203515807", ownerToken], [outsiderId, "999999999", outsiderToken]]) {
    await prisma.user.create({ data: {
      id, name: id,
      accounts: { create: { type: "oauth", provider: "github", providerAccountId } },
      sessions: { create: { sessionToken, expires: new Date(Date.now() + 3600_000) } },
    } });
  }

  for (const path of ["/", "/projects", "/api/projects", `/api/search?q=${suffix}`, "/rss", "/atom", "/rss.xml", "/feed.xml", "/sitemap.xml"]) {
    const text = await (await request(path, 200)).text();
    assert(text.includes(publicSlug), `Public project missing from ${path}`);
    assert(!text.includes(draftSlug), `Draft leaked through ${path}`);
    assert(!text.includes(unknownSlug), `Unknown status leaked through ${path}`);
    assert(!text.includes(draftPage), `Draft page leaked through ${path}`);
  }
  await request(`/projects/${publicSlug}`, 200);
  await request(`/${publicPage}`, 200);
  await request(`/${draftPage}`, 404);
  await request(`/api/og/page/${draftPage}`, 404);
  for (const slug of [draftSlug, unknownSlug]) {
    for (const path of [`/projects/${slug}`, `/api/projects/${slug}`, `/api/og/projects/${slug}`, `/api/projects/${slug}/reaction`]) await request(path, 404);
    await request(`/api/projects/${slug}/reaction`, 404, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "like" }) });
    await request("/api/track-view", 404, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
  }

  for (const path of ["/api/admin/validate/slug?slug=test&type=project", "/api/admin/analytics/export"]) {
    await request(path, 401);
    await request(path, 403, { headers: cookie(outsiderToken) });
    const response = await request(path, 200, { headers: cookie(ownerToken) });
    if (path.includes("export")) {
      const csv = await response.text();
      assert(csv.includes('"\'=HYPERLINK(""https://example.com"",""test"")"'));
      assert(csv.includes('"bad, ""address""\nsecond line"'));
    }
  }
  for (const path of ["/admin", "/admin/pages", "/admin/analytics", `/admin/edit/${publicSlug}`]) {
    await request(path, 307);
    await request(path, 404, { headers: cookie(outsiderToken) });
    await request(path, 200, { headers: cookie(ownerToken) });
  }
  await request("/api/upload/cover", 401, { method: "POST" });
  await request("/api/upload/cover", 403, mutation({}, outsiderToken));
  await request("/api/upload/cover", 403, mutation({}, ownerToken, "https://attacker.test"));
  const forgedUpload = new FormData();
  forgedUpload.set("file", new File(["<svg onload=alert(1)>"], "fake.png", { type: "image/png" }));
  await request("/api/upload/cover", 400, { method: "POST", headers: { ...cookie(ownerToken), origin: base.origin }, body: forgedUpload });

  const before = await prisma.project.findUniqueOrThrow({ where: { slug: publicSlug } });
  const feature = { _action: "feature", featured: "false", updatedAt: before.updatedAt.toISOString(), title: "stale-title", content: "stale-content", status: "Draft" };
  await request(`/api/admin/projects/${publicSlug}`, 303, mutation(feature));
  const after = await prisma.project.findUniqueOrThrow({ where: { slug: publicSlug } });
  assert.equal(after.title, before.title);
  assert.equal(after.content, before.content);
  assert.equal(after.status, "Completed");
  assert.equal(after.featured, false);
  assert(after.updatedAt > before.updatedAt);
  await request(`/api/admin/projects/${publicSlug}`, 409, mutation(feature));
  await request(`/api/admin/projects/${publicSlug}`, 409, mutation({ _action: "delete", updatedAt: before.updatedAt.toISOString() }));

  // A previously rendered/published project disappears on the next request.
  await prisma.project.update({ where: { slug: publicSlug }, data: { status: "Draft" } });
  await request(`/projects/${publicSlug}`, 404);
  for (const path of ["/projects", "/api/projects", "/sitemap.xml", "/feed.xml"]) {
    const text = await (await request(path, 200)).text();
    assert(!text.includes(publicSlug), `Stale published content cached at ${path}`);
  }

  // Run the seed twice and preserve an existing edit and its analytics.
  await seedTools.seed(prisma);
  const example = await prisma.project.update({ where: { slug: "failed-credit-card-dashboard" }, data: { title: "Keep local edit" } });
  await prisma.projectView.create({ data: { projectId: example.id, path: "/local-seed-check" } });
  await seedTools.seed(prisma);
  const preserved = await prisma.project.findUniqueOrThrow({ where: { id: example.id }, include: { views: true } });
  assert.equal(preserved.title, "Keep local edit");
  assert(preserved.views.some((view) => view.path === "/local-seed-check"));
  console.log(`PASS: ${checks} HTTP checks; draft privacy, database sessions, CSRF, uploads, atomic edits, seed preservation.`);
} finally {
  // Only fixtures in the explicitly named disposable database are removed.
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, outsiderId] } } });
  await prisma.page.deleteMany({ where: { slug: { in: [publicPage, draftPage] } } });
  await prisma.project.deleteMany({ where: { slug: { in: [publicSlug, draftSlug, unknownSlug] } } });
  await prisma.$disconnect();
}
