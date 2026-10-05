import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { localEnvironment, localOrigin } from "./local-preview-config.mjs";

if (Number(process.versions.node.split(".")[0]) !== 22) throw new Error("Use Node 22 for the local preview");
const env = localEnvironment();
async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve() : reject(new Error("Local preview setup failed")));
  });
}
// Check before starting services or migrations; don't replace another app instance.
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () => reject(new Error("Port 3001 is already occupied")));
  probe.listen(3001, "127.0.0.1", () => probe.close(resolve));
});
await run("docker", ["compose", "-f", "compose.local.yml", "-p", "predicta-local", "up", "-d", "--wait"]);
await run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"]);
await run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "diff", "--from-url", env.DATABASE_URL, "--to-schema-datamodel", "prisma/schema.prisma", "--exit-code"]);
await run(process.execPath, ["prisma/seed.cjs"]);
console.log(`Local preview: ${localOrigin} (local sample database and Redis).`);
console.log("Real GitHub sign-in and cover uploads are not configured. Use npm run local:admin for a local test session.");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3001"], { env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
server.once("error", () => { console.error("Local preview could not start"); process.exitCode = 1; });
server.once("exit", code => { process.exitCode = code ?? 0; });
