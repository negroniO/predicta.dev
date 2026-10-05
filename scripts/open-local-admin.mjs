// A local-only session fixture, like the browser tests; no application auth bypass.
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import { localDatabase, localOrigin } from "./local-preview-config.mjs";

const ready = await fetch(`${localOrigin}/api/health/ready`, { signal: AbortSignal.timeout(15000) });
if (!ready.ok) throw new Error("Start npm run dev:local and wait for database/Redis readiness first");
const db = new PrismaClient({ datasourceUrl: localDatabase });
const token = randomUUID(), id = `local-preview-${randomUUID()}`;
let context;
try {
  // Reuse the fixture account after interrupted runs or when opening another window.
  // Each window owns only its own session, so closing one does not sign out another.
  const account = await db.account.upsert({
    where: { provider_providerAccountId: { provider: "github", providerAccountId: "203515807" } },
    update: {},
    create: { type: "oauth", provider: "github", providerAccountId: "203515807",
      user: { create: { id, name: "Local preview administrator", email: `${id}@example.invalid` } } },
    select: { userId: true },
  });
  await db.session.create({ data: { userId: account.userId, sessionToken: token, expires: new Date(Date.now() + 8 * 3600_000) } });
  mkdirSync(".local-preview", { recursive: true, mode: 0o700 });
  // A separate temporary Chrome profile prevents cookies leaking into normal browsing.
  context = await chromium.launchPersistentContext(`.local-preview/${id}`, { channel: "chrome", headless: false, viewport: null });
  await context.addCookies([{ name: "next-auth.session-token", value: token, url: localOrigin, httpOnly: true, sameSite: "Lax" }]);
  const page = context.pages()[0] || await context.newPage();
  await page.goto(`${localOrigin}/admin`, { waitUntil: "domcontentloaded" });
  console.log("Opened local admin preview in a separate Chrome window. The test session expires in eight hours.");
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { void context.close(); });
  await new Promise(resolve => context.once("close", resolve));
} finally {
  await context?.close().catch(() => {});
  await db.session.deleteMany({ where: { sessionToken: token } });
  await db.$disconnect();
}
