import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { integrationConfig } from "./integration-config.mjs";

const config = integrationConfig();
const db = new PrismaClient({ datasourceUrl: config.database });
const cache = new Redis(config.redis, { maxRetriesPerRequest: 0 });
const suffix = randomUUID().replaceAll("-", "").slice(0, 8);
const prefix = `foundation-${suffix}`;
const ownerId = `${prefix}-owner`, token = randomUUID();
const slug = `${prefix}-project`, pageSlug = `${prefix}-page`;
const keys = [];
let checks = 0;
const ip = (n) => `2001:db8:${suffix.slice(0, 4)}:${suffix.slice(4)}::${n}`;
async function request(path, status, options = {}) {
  const response = await fetch(new URL(path, config.base), { redirect: "manual", ...options });
  assert.equal(response.status, status, `${options.method || "GET"} ${path}`);
  checks++;
  return response;
}
const json = (body, identity = ip(1)) => ({ method: "POST", headers: { "content-type": "application/json", "x-test-client": identity }, body: JSON.stringify(body) });
const admin = (fields) => ({ method: "POST", headers: { origin: config.base, cookie: `next-auth.session-token=${token}` }, body: new URLSearchParams(fields) });

try {
  const project = await db.project.create({ data: { slug, title: prefix, description: "Fixture", year: 2026, status: "Completed", tags: [], techStack: [] } });
  await db.user.create({ data: { id: ownerId, accounts: { create: { type: "oauth", provider: "github", providerAccountId: "203515807" } },
    sessions: { create: { sessionToken: token, expires: new Date(Date.now() + 3600000) } } } });

  for (const path of ["/api/subscribe", "/api/contact/track", "/api/track/outbound", "/api/track-view", `/api/projects/${slug}/reaction`]) {
    for (const body of [null, [], 42, { email: {}, href: {}, slug: {}, kind: {} }]) {
      const result = await request(path, 400, json(body));
      assert.equal((await result.json()).ok, false);
    }
    await request(path, 400, { ...json({}), body: "{" });
    await request(path, 413, json({ extra: "x".repeat(17000) }));
    await request(path, 415, { ...json({}), headers: { "content-type": "text/plain", "x-test-client": ip(1) } });
  }
  await request("/api/search?q=" + "x".repeat(201), 400);
  await request("/api/projects?limit=1000", 400);
  await request("/api/projects?cursor=1abc", 400);
  const first = await request("/api/projects?limit=1", 200);
  const firstPage = await first.json();
  assert.equal(firstPage.length, 1);
  assert(!("content" in firstPage[0]));
  const cursor = first.headers.get("x-next-cursor");
  assert(cursor);
  const next = await (await request(`/api/projects?limit=1&cursor=${cursor}`, 200)).json();
  assert.notEqual(next[0].id, firstPage[0].id);
  await request("/api/track-view", 200, json({ slug, visitorId: prefix, referrer: "https://example.com/private?token=sensitive#fragment" }));
  assert.equal((await db.projectView.findFirstOrThrow({ where: { visitorId: prefix } })).referrer, "https://example.com");
  await request("/api/subscribe", 200, json({ email: `${prefix}@example.test` }));
  await request("/api/subscribe", 200, json({ email: ` ${prefix.toUpperCase()}@EXAMPLE.TEST ` }));
  assert.equal(await db.newsletterSubscriber.count({ where: { email: `${prefix}@example.test` } }), 1);

  await request("/api/admin/pages", 303, admin({ title: "Test page", slug: pageSlug, status: "draft" }));
  await request("/api/admin/pages", 409, admin({ title: "Duplicate", slug: pageSlug }));
  await request("/api/admin/pages", 400, admin({ title: "Reserved", slug: "admin" }));
  await request("/api/admin/categories/1abc", 400, admin({}));
  const page = await db.page.findUniqueOrThrow({ where: { slug: pageSlug } });
  const fields = { title: "Updated page", slug: pageSlug, status: "draft", updatedAt: page.updatedAt.toISOString() };
  await request(`/api/admin/pages/${pageSlug}`, 303, admin(fields));
  await request(`/api/admin/pages/${pageSlug}`, 409, admin(fields));
  await request(`/api/admin/pages/${pageSlug}`, 409, admin({ _action: "delete", updatedAt: fields.updatedAt }));

  await db.projectView.createMany({ data: [
    { projectId: project.id, path: `${prefix}-inside`, createdAt: new Date("2030-01-02T12:00:00Z") },
    { projectId: project.id, path: `${prefix}-outside`, createdAt: new Date("2030-01-03T12:00:00Z") },
  ] });
  const headers = { cookie: `next-auth.session-token=${token}` };
  for (const path of ["/admin/analytics", "/api/admin/analytics/export"]) {
    const content = await (await request(`${path}?start=2030-01-02&end=2030-01-02`, 200, { headers })).text();
    assert(content.includes(`${prefix}-inside`));
    assert(!content.includes(`${prefix}-outside`));
    await request(`${path}?start=invalid&end=invalid`, 200, { headers });
  }

  // Real Redis: exactly 20 concurrent attempts reach validation, the rest get 429.
  const key = `predicta:rate:subscribe:${createHash("sha256").update(ip(2)).digest("hex")}`;
  keys.push(key);
  const results = await Promise.all(Array.from({ length: 25 }, () => fetch(`${config.base}/api/subscribe`, json({}, ip(2)))));
  assert.equal(results.filter((r) => r.status === 400).length, 20);
  assert.equal(results.filter((r) => r.status === 429).length, 5);
  assert(Number(results.find((r) => r.status === 429).headers.get("retry-after")) > 0);
  assert(await cache.pttl(key) > 0);
  checks += 4;
  await cache.pexpire(key, 1);
  await new Promise((resolve) => setTimeout(resolve, 20));
  await request("/api/subscribe", 400, json({}, ip(2)));
  await cache.persist(key);
  await request("/api/subscribe", 400, json({}, ip(2)));
  assert(await cache.pttl(key) > 0, "Missing TTL must be repaired atomically");

  const aliases = await Promise.all(Array.from({ length: 61 }, (_, i) => fetch(`${config.base}${i % 2 ? "/api/contact/track" : "/api/track/outbound"}`, json({}, ip(3)))));
  assert.equal(aliases.filter((r) => r.status === 400).length, 60);
  assert.equal(aliases.filter((r) => r.status === 429).length, 1);
  checks += 2;

  const alive = await request("/api/health", 200);
  assert.deepEqual(await alive.json(), { status: "alive" });
  assert.equal(alive.headers.get("cache-control"), "no-store");
  const ready = await request("/api/health/ready", 200);
  assert.deepEqual(await ready.json(), { status: "ready" });
  // Expire the process-local readiness cache before inducing this outage.
  await new Promise(resolve => setTimeout(resolve, 5100));
  // Pause only this disposable Redis. Writes fail closed; public reads keep working.
  await cache.client("PAUSE", 4000, "ALL");
  const unhealthy = await request("/api/health/ready", 503);
  assert.deepEqual(await unhealthy.json(), { status: "unavailable" });
  assert.equal(unhealthy.headers.get("retry-after"), "5");
  await request("/api/health", 200);
  const unavailable = await request("/api/subscribe", 503, json({ email: `${prefix}-outage@example.test` }, ip(4)));
  assert.equal((await unavailable.json()).error, "rate_limit_unavailable");
  assert.equal(await db.newsletterSubscriber.count({ where: { email: `${prefix}-outage@example.test` } }), 0);
  await request(`/api/projects/${slug}`, 200);
  await new Promise(resolve => setTimeout(resolve, 5100));
  await request("/api/health/ready", 200);
  console.log(`PASS: ${checks} foundation checks; bounded input, pagination, conflicts, date filters, real Redis concurrency/TTL/recovery/outage.`);
} finally {
  await db.user.deleteMany({ where: { id: ownerId } });
  await db.page.deleteMany({ where: { slug: pageSlug } });
  await db.project.deleteMany({ where: { slug } });
  await db.newsletterSubscriber.deleteMany({ where: { email: { startsWith: prefix } } });
  if (keys.length) await cache.del(...keys);
  cache.disconnect();
  await db.$disconnect();
}
