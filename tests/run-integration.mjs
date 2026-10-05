import { spawn } from "node:child_process";
import { once } from "node:events";
import { integrationConfig } from "./integration-config.mjs";

const config = integrationConfig();
const env = { ...process.env, DATABASE_URL: config.database, REDIS_URL: config.redis,
  NEXTAUTH_URL: config.base, NEXTAUTH_SECRET: "integration-test-secret-not-for-deployment",
  GITHUB_ID: "test", GITHUB_SECRET: "test", ADMIN_GITHUB_IDS: "203515807",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "",
  NEXT_PUBLIC_SITE_URL: config.base, NEXT_PUBLIC_BASE_URL: config.base,
  RATE_LIMIT_BACKEND: "redis", RATE_LIMIT_IP_HEADER: "x-test-client",
  PHASE0_TEST_BASE_URL: config.base, NEXT_TELEMETRY_DISABLED: "1",
};

async function run(script, args = []) {
  const child = spawn(process.execPath, [script, ...args], { env, stdio: "inherit" });
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`${script} failed (${code})`);
}

let server;
try {
  // Refuse to run against an unrelated process already listening at this origin.
  let occupied = false;
  try { await fetch(`${config.base}/robots.txt`, { signal: AbortSignal.timeout(1000) }); occupied = true; } catch {}
  if (occupied) throw new Error("Integration port is already in use");
  await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
  await run("node_modules/prisma/build/index.js", ["migrate", "diff", "--from-url", config.database, "--to-schema-datamodel", "prisma/schema.prisma", "--exit-code"]);
  await run("node_modules/next/dist/bin/next", ["build"]);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", config.port], { env, stdio: "inherit" });
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error("Integration server exited before becoming ready");
    try { ready = (await fetch(`${config.base}/robots.txt`, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Integration server did not become ready");
  await run("tests/phase0-http.mjs");
  if (process.argv.includes("--browser")) await run("tests/product-browser.mjs");
  await run("tests/foundation-http.mjs");
  await run("tests/health-http.mjs");
} finally {
  if (server && server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    const timer = setTimeout(() => server.kill("SIGKILL"), 5000);
    await stopped;
    clearTimeout(timer);
  }
}
