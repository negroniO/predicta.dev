import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { integrationConfig } from "./integration-config.mjs";

const config = integrationConfig();
const database = new URL(config.database);
database.port = "1"; // Closed loopback port: this process cannot reach the real database.
const port = String(Number(config.port) + 1);
const base = `http://127.0.0.1:${port}`;
let occupied = false;
try { await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) }); occupied = true; } catch {}
assert(!occupied, "Health test port is already in use");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", port], {
  env: { ...process.env, DATABASE_URL: database.href, REDIS_URL: "", RATE_LIMIT_BACKEND: "redis", NEXTAUTH_URL: base }, stdio: "inherit",
});
try {
  let response;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error("Health test server exited");
    try { response = await fetch(`${base}/api/health`); } catch {}
    if (response?.ok) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(response?.ok);
  assert.deepEqual(await response.json(), { status: "alive" });
  const start = Date.now();
  const responses = await Promise.all(Array.from({ length: 10 }, () => fetch(`${base}/api/health/ready`)));
  assert(Date.now() - start < 5000, "Readiness must respond within its deadline");
  for (const result of responses) {
    assert.equal(result.status, 503);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.deepEqual(await result.json(), { status: "unavailable" });
  }
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  console.log("PASS: health endpoints remain bounded and private with database and Redis unavailable (10 concurrent probes).");
} finally {
  if (server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    const timer = setTimeout(() => server.kill("SIGKILL"), 5000);
    await stopped;
    clearTimeout(timer);
  }
}
