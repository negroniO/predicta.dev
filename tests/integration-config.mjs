import assert from "node:assert/strict";

/** @param {Record<string, string | undefined>} env */
export function integrationConfig(env = process.env) {
  const database = env.DATABASE_URL || "postgresql://predicta_test:local_test_only@127.0.0.1:55440/predicta_test";
  const redis = env.REDIS_URL || "redis://127.0.0.1:56380";
  const base = env.PHASE0_TEST_BASE_URL || "http://127.0.0.1:3107";
  const db = new URL(database), cache = new URL(redis), site = new URL(base);
  const local = (url) => ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  assert(local(db) && db.pathname === "/predicta_test" && !db.search && ["postgres:", "postgresql:"].includes(db.protocol), "Integration tests require a loopback database named predicta_test with no URL parameters");
  assert(local(cache) && cache.protocol === "redis:" && !cache.search && !cache.username && !cache.password && ["", "/", "/0"].includes(cache.pathname), "Integration tests require disposable loopback Redis database 0");
  assert(local(site) && site.protocol === "http:" && site.port && site.pathname === "/" && !site.search && !site.username && !site.password, "Integration server must use a loopback HTTP origin and an explicit port");
  return { database, redis, base: site.origin, port: site.port };
}
