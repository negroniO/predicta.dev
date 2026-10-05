import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { integrationConfig } from "./integration-config.mjs";

const config = integrationConfig();
const db = new PrismaClient({ datasourceUrl: config.database });
const prefix = `product-${randomUUID().slice(0, 8)}`;
const token = randomUUID();
let browser, currentPage, checks = 0;
const check = (value, message) => { assert(value, message); checks++; };
const waitText = async (page, text) => { await page.getByText(text, { exact: false }).first().waitFor(); checks++; };
try {
  await db.user.create({ data: { id: prefix, accounts: { create: { type: "oauth", provider: "github", providerAccountId: "203515807" } },
    sessions: { create: { sessionToken: token, expires: new Date(Date.now() + 3600000) } } } });
  await db.project.create({ data: { slug: prefix, title: "Product browser fixture", description: "Browser verification", content: "## A case study", year: 2026, status: "Completed", tags: [], techStack: [] } });
  await db.page.create({ data: { slug: prefix, title: "Product page fixture", status: "draft", content: "Original content" } });
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([{ name: "next-auth.session-token", value: token, url: config.base }]);
    await context.route("**/*", route => new URL(route.request().url()).origin === config.base ? route.continue() : route.abort());
    const page = await context.newPage();
    currentPage = page;
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    // Actual stale-write conflict: preserve editor text and focus the inline error.
    await page.goto(`${config.base}/admin/pages`, { waitUntil: "networkidle" });
    const create = page.locator('form[action="/api/admin/pages"]');
    check(await create.locator('[name="status"]').inputValue() === "draft", "new pages are private drafts");
    const edit = page.locator(`form[action="/api/admin/pages/${prefix}"]`).filter({ has: page.locator('[name="title"]') });
    await edit.getByLabel("Title *", { exact: true }).fill(`Unsaved ${width}`);
    await edit.locator('[name="content"]').fill(`Important unsaved content ${width}`);
    await db.page.update({ where: { slug: prefix }, data: { title: `Changed elsewhere ${width}`, updatedAt: new Date(Date.now() + 1000) } });
    await edit.getByRole("button", { name: "Save page", exact: true }).click();
    await waitText(page, "This item changed since you opened it.");
    check(await edit.locator('[name="content"]').inputValue() === `Important unsaved content ${width}`, "stale edit preserves content");
    check(await edit.getByRole("alert").evaluate(el => el === document.activeElement), "save error receives keyboard focus");
    check(!await edit.getByRole("button", { name: "Save page", exact: true }).isDisabled(), "save can be retried");
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "admin editor fits viewport");
    await edit.getByRole("alert").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/predicta-product-admin-${width}.png` });
    // Cancel an internal navigation, then accept it: one prompt in each case.
    let dialogs = 0;
    const cancel = async dialog => { dialogs++; await dialog.dismiss(); };
    page.on("dialog", cancel);
    await page.getByRole("link", { name: "Projects", exact: true }).last().click();
    check(page.url().includes("/admin/pages"), "cancelled navigation stays in editor");
    check(dialogs === 1, "one unsaved-change prompt");
    page.off("dialog", cancel);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("link", { name: "Projects", exact: true }).last().click();
    await page.waitForURL(`${config.base}/admin`);
    check(await page.locator('form[action="/api/admin/projects"] [name="status"]').inputValue() === "Draft", "new projects default to private drafts");
    // Real duplicate slug, correction and successful create without losing fields.
    await page.goto(`${config.base}/admin/pages`, { waitUntil: "networkidle" });
    await create.getByLabel("Title *", { exact: true }).fill(`New page ${width}`);
    await create.getByLabel("Slug (URL) *", { exact: true }).fill(prefix);
    await create.locator('[name="content"]').fill("Keep this content");
    await create.getByRole("button", { name: "Create page", exact: true }).click();
    await waitText(page, "This slug is already in use.");
    check(await create.locator('[name="content"]').inputValue() === "Keep this content", "duplicate preserves content");
    await create.getByLabel("Slug (URL) *", { exact: true }).fill(`${prefix}-${width}`);
    await create.getByRole("button", { name: "Create page", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/created=1/, { timeout: 10000 });
    const created = await db.page.findUniqueOrThrow({ where: { slug: `${prefix}-${width}` } });
    check(created.content === "Keep this content" && created.status === "draft", "keyboard retry creates private draft");
    check(!await page.locator('form[action="/api/admin/pages"] [name="title"]').inputValue(), "successful save resets create form");
    // Upload selection survives validation errors; a network error retains all fields.
    await page.goto(`${config.base}/admin/edit/${prefix}`, { waitUntil: "networkidle" });
    const projectForm = page.locator("form").filter({ has: page.locator('[name="title"]') });
    await projectForm.getByLabel("Title *", { exact: true }).fill("Retained project title");
    await projectForm.locator('[name="coverImage"]').setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64") });
    const mutation = `**/api/admin/projects/${prefix}`;
    await page.route(mutation, route => route.fulfill({ status: 400, json: { error: "invalid_project", message: "Choose a valid year" } }));
    await projectForm.getByRole("button", { name: "Save changes", exact: true }).click();
    await waitText(page, "Choose a valid year");
    check(await projectForm.locator('[name="coverImage"]').evaluate(el => el.files[0].name) === "cover.png", "selected file survives error");
    await page.unroute(mutation);
    await page.route(mutation, route => route.abort());
    await projectForm.getByRole("button", { name: "Save changes", exact: true }).click();
    await waitText(page, "Could not confirm the save.");
    check(await projectForm.getByLabel("Title *", { exact: true }).inputValue() === "Retained project title", "network error preserves title");
    await page.unroute(mutation);
    await page.route(mutation, route => route.fulfill({ status: 401, json: { error: "unauthorized" } }));
    await projectForm.getByRole("button", { name: "Save changes", exact: true }).click();
    await waitText(page, "Sign in again in another tab");
    check(await projectForm.getByLabel("Title *", { exact: true }).inputValue() === "Retained project title", "expired session retains edits");
    await page.unroute(mutation);
    // The reload warning also preserves file inputs when dismissed.
    page.once("dialog", dialog => dialog.dismiss());
    await page.reload().catch(() => {});
    check(await projectForm.locator('[name="coverImage"]').evaluate(el => el.files.length) === 1, "cancelled reload retains selected file");
    page.once("dialog", dialog => dialog.dismiss());
    await page.goBack().catch(() => {});
    check(page.url().includes(`/admin/edit/${prefix}`), "cancelled Back navigation stays in editor");
    check(await projectForm.locator('[name="coverImage"]').evaluate(el => el.files.length) === 1, "cancelled Back navigation preserves file");
    page.once("dialog", dialog => dialog.accept());
    await page.goto(`${config.base}/projects`, { waitUntil: "networkidle" });
    const search = page.getByRole("textbox", { name: "Search projects", exact: true });
    await search.fill("no-matches-for-this-query");
    await page.getByRole("button", { name: "clear the filters" }).click();
    check(await search.inputValue() === "", "empty results offer working reset");
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "project list fits viewport");
    // Reactions distinguish unavailable counts from a real zero and permit a retry.
    const reaction = `**/api/projects/${prefix}/reaction`;
    await page.route(reaction, route => route.fulfill({ status: 503, json: {} }));
    await page.goto(`${config.base}/projects/${prefix}`, { waitUntil: "networkidle" });
    await waitText(page, "Reactions could not be loaded.");
    await page.unroute(reaction);
    await page.getByRole("button", { name: "Retry loading reactions" }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(el => el.getAttribute('aria-label')?.startsWith('Like this project') && !el.disabled));
    await page.route(reaction, route => route.fulfill({ status: 429, headers: { "Retry-After": "12" }, json: {} }));
    await page.getByRole("button", { name: /^Like this project/ }).click();
    await waitText(page, "Try again in 12 seconds.");
    await page.unroute(reaction);
    await page.getByRole("button", { name: /^Like this project/ }).click();
    await page.waitForFunction(() => document.querySelector('button[aria-label^="Like this project"]')?.getAttribute('aria-pressed') === 'true');
    checks++;
    // Subscription can retry failures without retyping an email.
    await page.goto(config.base, { waitUntil: "networkidle" });
    const email = page.getByRole("textbox", { name: "Email address", exact: true });
    const address = `${prefix}-${width}@example.test`;
    await email.fill(address);
    await page.route("**/api/subscribe", route => route.fulfill({ status: 503, headers: { "Retry-After": "30" }, json: {} }));
    await page.getByRole("button", { name: "Subscribe", exact: true }).click();
    await waitText(page, "Try again in 30 seconds.");
    check(await email.inputValue() === address, "failed subscription retains email");
    await page.unroute("**/api/subscribe");
    await page.getByRole("button", { name: "Try again", exact: true }).focus();
    await page.keyboard.press("Enter");
    await waitText(page, "Your interest has been registered.");
    check(await email.inputValue() === "", "successful subscription clears email");
    check(errors.length === 0, `no browser errors: ${errors.join(", ")}`);
    await context.close();
  }
  console.log(`PASS: ${checks} product browser checks at desktop and mobile widths.`);
} catch (error) {
  if (currentPage) {
    console.error("Browser failure", currentPage.url(), await currentPage.locator('[role="alert"], [role="status"]').allTextContents());
    await currentPage.screenshot({ path: "/tmp/predicta-product-failure.png", fullPage: true });
  }
  throw error;
} finally {
  await browser?.close();
  await db.user.deleteMany({ where: { id: prefix } });
  await db.page.deleteMany({ where: { slug: { startsWith: prefix } } });
  await db.project.deleteMany({ where: { slug: prefix } });
  await db.newsletterSubscriber.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.$disconnect();
}
