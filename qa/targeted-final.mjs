import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "..");
const BASE = "http://127.0.0.1:3100";
const FIXTURES = JSON.parse(readFileSync(join(ROOT, "qa", "fixtures", "routes.json"), "utf8"));

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
    pass(name, await fn());
  } catch (error) {
    fail(name, error);
  }
}

async function newContext(options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...options,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("circularlink.lang", "en");
      localStorage.setItem("circularlink-theme", "light");
    } catch {}
  });
  return context;
}

async function signInDemo(page, demo = "buyer") {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const selector = demo === "buyer"
    ? 'button[aria-label*="buyer"], button[aria-label*="acquirente"]'
    : 'button[aria-label*="supplier"], button[aria-label*="fornitore"]';
  await page.locator(selector).first().click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20000 });
  await page.waitForSelector(".offcut-app-links a", { state: "visible", timeout: 20000 });
}

const uiContext = await newContext();
const uiPage = await uiContext.newPage();
const uiErrors = [];
uiPage.on("console", (m) => { if (m.type() === "error") uiErrors.push(m.text()); });
uiPage.on("pageerror", (e) => uiErrors.push(`pageerror: ${e.message}`));
uiPage.on("response", (r) => { if (r.status() >= 400) uiErrors.push(`HTTP ${r.status()} ${r.url()}`); });

await step("demo login + app nav", async () => {
  await signInDemo(uiPage);
  const links = await uiPage.locator(".offcut-app-links a").count();
  assert.ok(links >= 5, `link app=${links}`);
  return `${links} link operativi visibili`;
});

await step("chat non intrusivo e nome Offcut AI", async () => {
  assert.equal(await uiPage.locator("#chat-panel.open").count(), 0);
  const style = await uiPage.locator("#chat-toggle").evaluate((el) => ({
    animation: getComputedStyle(el).animationName,
    beforeContent: getComputedStyle(el, "::before").content,
    svg: el.querySelectorAll("svg").length,
    emoji: /[💬✕]/u.test(el.textContent || ""),
  }));
  assert.equal(style.animation, "none");
  assert.equal(style.beforeContent, "none");
  assert.equal(style.svg, 1);
  assert.equal(style.emoji, false);
  await uiPage.locator("#chat-toggle").click();
  await uiPage.waitForSelector("#chat-panel.open", { timeout: 10000 });
  const header = await uiPage.locator("#chat-header").innerText();
  assert.match(header, /Offcut AI/i);
  await uiPage.locator("#chat-close").click();
  await uiPage.waitForTimeout(150);
  assert.equal(await uiPage.locator("#chat-panel.open").count(), 0);
  return "chiuso all'avvio, icona SVG, nessuna animazione continua, nome Offcut AI, open/close OK";
});

await step("testi senza emoji", async () => {
  await uiPage.goto(`${BASE}/app/listings`, { waitUntil: "domcontentloaded" });
  await uiPage.waitForSelector("h1", { timeout: 15000 });
  const text = await uiPage.locator("body").innerText();
  assert.ok(!/[💡💬]/u.test(text));
  return "0 emoji nelle liste annunci";
});

await step("traduzione logistica EN", async () => {
  await uiPage.goto(`${BASE}/app/orders/ord_rpet`, { waitUntil: "domcontentloaded" });
  await uiPage.waitForSelector("h1", { timeout: 15000 });
  const text = (await uiPage.locator("body").innerText()).replace(/\s+/g, " ");
  assert.match(text, /Offcut coordinates partners, processing and quality control/i);
  assert.ok(!/Offcut coordina partner/i.test(text));
  return "testo EN completo, nessun residuo IT";
});

await step("badge verifica non inventati", async () => {
  await uiPage.goto(`${BASE}/app/settings`, { waitUntil: "domcontentloaded" });
  await uiPage.waitForSelector("h1", { timeout: 15000 });
  const text = await uiPage.locator("body").innerText();
  assert.ok(!/VAT verified|VAT number to verify|Partita IVA verificata/i.test(text));
  return "nessun badge o stato KYC fittizio";
});

await step("console e HTTP UI", async () => {
  assert.deepEqual(uiErrors, []);
  return "0 errori console/pageerror/HTTP";
});

await uiContext.close().catch(() => {});

/* API chat: limiti e header di sicurezza (richieste fuori pagina, nessun errore console). */
const apiContext = await browser.newContext();
await step("CSP report-only", async () => {
  const response = await apiContext.request.get(BASE, { timeout: 15000 });
  assert.equal(response.status(), 200);
  const headers = response.headers();
  const csp = headers["content-security-policy-report-only"] || headers["Content-Security-Policy-Report-Only"];
  assert.ok(csp, "header CSP report-only assente");
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  return "header presente, default-src self e frame-ancestors none";
});

await step("API chat payload e rate limit", async () => {
  const headers = { "content-type": "application/json", "x-forwarded-for": `qa-targeted-${Date.now()}.203.0.113` };
  const oversized = await apiContext.request.post(`${BASE}/api/chat`, {
    headers,
    data: { message: "x".repeat(11_000) },
    timeout: 15000,
  });
  assert.equal(oversized.status(), 413);

  const invalid = await apiContext.request.post(`${BASE}/api/chat`, {
    headers,
    data: { message: "" },
    timeout: 15000,
  });
  assert.equal(invalid.status(), 400);

  for (let i = 0; i < 18; i += 1) {
    const answer = await apiContext.request.post(`${BASE}/api/chat`, {
      headers,
      data: { message: "" },
      timeout: 15000,
    });
    assert.equal(answer.status(), 400, `richiesta ${i + 2} status=${answer.status()}`);
  }
  const limited = await apiContext.request.post(`${BASE}/api/chat`, {
    headers,
    data: { message: "" },
    timeout: 15000,
  });
  assert.equal(limited.status(), 429);
  assert.ok(Number(limited.headers()["retry-after"]) >= 1);
  return "413 oltre 10 KB, 400 messaggio vuoto, 429 dopo 20 richieste/min";
});

await apiContext.close().catch(() => {});

/* Sweep mirato dei viewport richiesti ma non ancora coperti dal QA storico. */
for (const width of [360, 375]) {
  const height = width === 360 ? 780 : 812;
  const context = await newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  try {
    await signInDemo(page);
    let maxOverflow = 0;
    for (const [index, route] of FIXTURES.routes.entries()) {
      const response = await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      assert.equal(response?.status(), 200, `${route.path} HTTP ${response?.status()}`);
      await page.waitForSelector("h1", { state: "visible", timeout: 15000 });
      await page.waitForTimeout(120);
      const metrics = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        broken: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length,
      }));
      assert.ok(metrics.h1 >= 1, `${route.path} senza h1`);
      assert.equal(metrics.broken, 0, `${route.path} immagini rotte`);
      maxOverflow = Math.max(maxOverflow, metrics.overflow);
      console.log(`[viewport] ${width}px ${index + 1}/${FIXTURES.routes.length} ${route.path} overflow=${metrics.overflow}px`);
    }
    await page.goto(`${BASE}/app/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".offcut-app-links a", { state: "visible", timeout: 15000 });
    const navLinks = await page.locator(".offcut-app-links a").count();
    assert.ok(navLinks >= 5, `link app=${navLinks}`);
    assert.deepEqual(errors, []);
    pass(`Sweep ${width}px`, `${FIXTURES.routes.length} route, overflow max=${maxOverflow}px, ${navLinks} link app, 0 errori`);
  } catch (error) {
    fail(`Sweep ${width}px`, error);
  } finally {
    await context.close().catch(() => {});
  }
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  checks,
  failures,
};
mkdirSync(join(ROOT, "qa", "logs"), { recursive: true });
console.log(`[targeted] ${checks.length} PASS, ${failures.length} errori`);
if (failures.length) {
  console.error(failures.map((f) => `${f.name}: ${f.error}`).join("\n"));
  process.exitCode = 1;
}
void report;
