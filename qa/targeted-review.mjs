import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "..");
const BASE = "http://127.0.0.1:3100";

function loadPlaywright() {
  const candidates = [];
  for (const name of ["playwright", "playwright-core"]) {
    try { candidates.push(require.resolve(name)); } catch {}
  }
  const npxRoot = join(homedir(), ".npm", "_npx");
  if (existsSync(npxRoot)) {
    for (const dir of readdirSync(npxRoot)) {
      for (const file of ["index.mjs", "index.js"]) {
        const p = join(npxRoot, dir, "node_modules", "playwright", file);
        if (existsSync(p)) candidates.push(p);
      }
    }
  }
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("Playwright non disponibile");
  return require(found);
}

const pw = loadPlaywright();
const browser = await pw.chromium.launch({
  headless: true,
  args: platform() === "linux" ? ["--no-sandbox"] : [],
});
const checks = [];
const failures = [];

function pass(name, detail) {
  checks.push({ name, status: "PASS", detail });
  console.log(`[targeted] PASS ${name}: ${detail}`);
}

function fail(name, error) {
  failures.push({ name, error: error instanceof Error ? error.message : String(error) });
  console.error(`[targeted] FAIL ${name}: ${error}`);
}

async function step(name, fn) {
  try {
    const detail = await fn();
    pass(name, detail);
  } catch (error) {
    fail(name, error);
  }
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  try {
    localStorage.setItem("circularlink.lang", "en");
    localStorage.setItem("circularlink-theme", "light");
  } catch {}
});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });

await step("demo login + app nav", async () => {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('button[aria-label*="buyer"]').first().click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20000 });
  await page.waitForSelector(".offcut-app-links a", { state: "visible", timeout: 20000 });
  const links = await page.locator(".offcut-app-links a").count();
  assert.ok(links >= 5, `link app=${links}`);
  return `${links} link operativi visibili`;
});

await step("chat non intrusivo", async () => {
  assert.equal(await page.locator("#chat-panel.open").count(), 0);
  const before = await page.locator("#chat-toggle").evaluate((el) => ({
    animation: getComputedStyle(el).animationName,
    beforeAnimation: getComputedStyle(el, "::before").animationName,
    beforeContent: getComputedStyle(el, "::before").content,
    svg: el.querySelectorAll("svg").length,
    emoji: /[💬✕]/u.test(el.textContent || ""),
  }));
  assert.equal(before.animation, "none");
  assert.equal(before.beforeContent, "none");
  assert.equal(before.svg, 1);
  assert.equal(before.emoji, false);
  await page.locator("#chat-toggle").click();
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#chat-panel.open").count(), 1);
  await page.locator("#chat-close").click();
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#chat-panel.open").count(), 0);
  return `chiuso all'avvio, icona SVG, nessuna animazione continua, open/close OK`;
});

await step("testi senza emoji", async () => {
  await page.goto(`${BASE}/app/listings`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 15000 });
  const text = await page.locator("body").innerText();
  assert.ok(!/[💡💬]/u.test(text));
  return "0 emoji nelle liste annunci";
});

await step("traduzione logistica EN", async () => {
  await page.goto(`${BASE}/app/orders/ord_rpet`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 15000 });
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  assert.ok(/Offcut coordinates partners, processing and quality control/i.test(text));
  assert.ok(!/Offcut coordina partner/i.test(text));
  return "testo EN completo, nessun residuo IT";
});

await step("badge verifica non inventati", async () => {
  await page.goto(`${BASE}/app/settings`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 15000 });
  const text = await page.locator("body").innerText();
  assert.ok(!/VAT verified|VAT number to verify|Partita IVA verificata/i.test(text));
  return "nessun badge o stato KYC fittizio";
});

await step("console e HTTP", async () => {
  assert.deepEqual(errors, []);
  return "0 errori console/pageerror/HTTP";
});

await browser.close();
mkdirSync(join(ROOT, "qa", "logs"), { recursive: true });
const summary = { generatedAt: new Date().toISOString(), baseUrl: BASE, checks, failures };
console.log(`[targeted] ${checks.length} PASS, ${failures.length} errori`);
if (failures.length) process.exitCode = 1;
void summary;
