#!/usr/bin/env node
/**
 * Offcut 2.1 audit: real-browser pass before/after visual changes.
 * Read-only; captures screenshots and structured evidence for both demo roles.
 * Usage: node qa/v21-audit.mjs [--phase before|after]
 */
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith("--")) continue;
  const eq = arg.indexOf("=");
  if (eq >= 0) {
    opts[arg.slice(2, eq)] = arg.slice(eq + 1);
  } else {
    const next = argv[i + 1];
    opts[arg.slice(2)] = next && !next.startsWith("--") ? argv[++i] : true;
  }
}
const PHASE = String(opts.phase || "before");
const OUT = join(ROOT, "qa", "audit-v2.1", PHASE);
const SHOTS = join(OUT, "screens");
const BASE = String(opts.base || process.env.QA_BASE_URL || "http://127.0.0.1:3100").replace(/\/$/, "");
mkdirSync(SHOTS, { recursive: true });

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

const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/chi-siamo", name: "about" },
  { path: "/impatto", name: "impact" },
  { path: "/preventivo", name: "quote" },
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
  { path: "/forgot-password", name: "forgot-password" },
  { path: "/onboarding", name: "onboarding" },
  { path: "/privacy", name: "privacy" },
  { path: "/terms", name: "terms" },
];

const APP_ROUTES = [
  { path: "/app/dashboard", name: "dashboard" },
  { path: "/app/marketplace", name: "marketplace" },
  { path: "/app/marketplace/lst_occ", name: "material-detail" },
  { path: "/app/matches", name: "matches" },
  { path: "/app/inbox", name: "inbox" },
  { path: "/app/orders", name: "orders" },
  { path: "/app/orders/ord_occ", name: "order-detail" },
  { path: "/app/listings", name: "listings" },
  { path: "/app/listings/new", name: "listing-new" },
  { path: "/app/requests", name: "requests" },
  { path: "/app/requests/new", name: "request-new" },
  { path: "/app/settings", name: "settings" },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const PUBLIC_PROFILES = [
  { name: "desktop-light-it", vp: "desktop", lang: "it", theme: "light" },
  { name: "desktop-dark-en", vp: "desktop", lang: "en", theme: "dark" },
  { name: "mobile-light-en", vp: "mobile", lang: "en", theme: "light" },
  { name: "tablet-dark-it", vp: "tablet", lang: "it", theme: "dark" },
];

const APP_PROFILES = [
  { name: "desktop-light-it", vp: "desktop", lang: "it", theme: "light", role: "buyer" },
  { name: "mobile-dark-en", vp: "mobile", lang: "en", theme: "dark", role: "buyer" },
  { name: "desktop-light-en", vp: "desktop", lang: "en", theme: "light", role: "supplier" },
  { name: "mobile-dark-it", vp: "mobile", lang: "it", theme: "dark", role: "supplier" },
  { name: "tablet-light-it", vp: "tablet", lang: "it", theme: "light", role: "supplier", limited: true },
];

const KEY_APP_ROUTES = new Set(["dashboard", "marketplace", "material-detail", "matches", "inbox", "orders", "listing-new", "request-new", "settings"]);

async function newContext(profile) {
  const context = await browser.newContext({
    viewport: VIEWPORTS[profile.vp],
    colorScheme: profile.theme,
    reducedMotion: "reduce",
  });
  await context.addInitScript(({ lang, theme }) => {
    try {
      localStorage.setItem("offcut.lang", lang);
      localStorage.setItem("offcut-theme", theme);
      // Legacy keys: the audit also verifies migration paths.
      localStorage.setItem("circularlink.lang", lang);
      localStorage.setItem("circularlink-theme", theme);
    } catch {}
  }, { lang: profile.lang, theme: profile.theme });
  return context;
}

async function signIn(page, role) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  const selector = role === "buyer"
    ? 'button[aria-label*="acquirente"], button[aria-label*="buyer"]'
    : 'button[aria-label*="fornitore"], button[aria-label*="supplier"]';
  const button = page.locator(selector).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await page.waitForTimeout(400); // React hydration
  await button.click();
  await page.waitForURL(/\/app\/dashboard/, { waitUntil: "domcontentloaded", timeout: 25000 });
}

function attachListeners(page, getRow) {
  page.on("console", (msg) => {
    if (msg.type() === "error") getRow()?.consoleErrors.push(msg.text().slice(0, 240));
  });
  page.on("pageerror", (err) => getRow()?.pageErrors.push(String(err.message || err).slice(0, 240)));
  page.on("response", (res) => {
    if (res.status() >= 400) getRow()?.httpErrors.push(`${res.status()} ${res.url().slice(0, 160)}`);
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const text = document.body.innerText || "";
    return {
      title: document.title,
      htmlLang: document.documentElement.lang,
      h1: (document.querySelector("h1")?.innerText || "").trim().slice(0, 140),
      textLength: text.trim().length,
      loadingWords: (text.match(/caricamento|loading|in attesa|please wait/gi) || []).length,
      busyNodes: document.querySelectorAll('[aria-busy="true"], [class*="animate-pulse"]').length,
      overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      inputs: document.querySelectorAll("input, select, textarea").length,
      buttons: document.querySelectorAll("button").length,
      activeNav: document.querySelectorAll('[aria-current="page"], [data-active="true"], .offcut-app-links a.on').length,
      brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.getAttribute("src") || "").slice(0, 8),
      theme: document.documentElement.dataset.theme || (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    };
  });
}

const rows = [];
let seq = 0;
let currentRow = null;

async function capture({ page, route, profile, role = null }) {
  const row = {
    id: ++seq,
    route: route.path,
    name: route.name,
    role,
    profile: profile.name,
    lang: profile.lang,
    theme: profile.theme,
    viewport: profile.vp,
    consoleErrors: [],
    pageErrors: [],
    httpErrors: [],
  };
  currentRow = row;
  try {
    const response = await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    row.status = response?.status() || 0;
    await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {});
    await page.evaluate(async () => {
      for (const img of [...document.images].filter((image) => image.loading === "lazy")) {
        img.scrollIntoView({ block: "center", inline: "nearest" });
        if (!img.complete) {
          await Promise.race([
            new Promise((done) => { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }),
            new Promise((done) => setTimeout(done, 200)),
          ]);
        }
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(200);
    Object.assign(row, await measure(page));
    row.screenshot = join("screens", `${String(row.id).padStart(3, "0")}-${role || "public"}-${profile.name}-${route.name}.png`);
    await page.screenshot({ path: join(OUT, row.screenshot), fullPage: route.name === "home" || route.name === "impact" });
    if (route.name === "home" && profile.lang === "en" && profile.vp === "desktop") {
      await page.locator("#chat-toggle").click().catch(() => {});
      await page.waitForTimeout(250);
      row.botGreeting = (await page.locator("#chat-messages").innerText().catch(() => "")) || "";
    }
  } catch (err) {
    row.fatal = String(err.message || err).slice(0, 300);
  } finally {
    currentRow = null;
  }
  rows.push(row);
  return row;
}

async function runProfile(profile, routes, role = null) {
  const context = await newContext(profile);
  const page = await context.newPage();
  attachListeners(page, () => currentRow);
  try {
    if (role) await signIn(page, role);
    for (const route of routes) await capture({ page, route, profile, role });
  } catch (err) {
    const row = {
      id: ++seq, route: "/login", name: "sign-in", role, profile: profile.name,
      lang: profile.lang, theme: profile.theme, viewport: profile.vp,
      consoleErrors: [], pageErrors: [], httpErrors: [],
      fatal: String(err.message || err).slice(0, 300),
    };
    rows.push(row);
  } finally {
    await context.close().catch(() => {});
  }
}

for (const profile of PUBLIC_PROFILES) await runProfile(profile, PUBLIC_ROUTES);
for (const profile of APP_PROFILES) {
  const routes = profile.limited ? APP_ROUTES.filter((r) => KEY_APP_ROUTES.has(r.name)) : APP_ROUTES;
  await runProfile(profile, routes, profile.role);
}

const findings = [];
for (const row of rows) {
  if (row.fatal) findings.push({ severity: "high", type: "fatal", row: row.id, detail: row.fatal });
  if (row.status && row.status >= 400) findings.push({ severity: "high", type: "http", row: row.id, detail: `${row.status} ${row.route}` });
  if ((row.loadingWords > 2 || row.busyNodes > 3) && row.textLength < 600) findings.push({ severity: "medium", type: "stuck-loading", row: row.id, detail: `${row.loadingWords} parole, ${row.busyNodes} nodi` });
  if (row.textLength < 200 && row.route !== "/onboarding") findings.push({ severity: "medium", type: "thin-content", row: row.id, detail: `${row.textLength} caratteri` });
  if (row.overflowPx > 1) findings.push({ severity: "high", type: "overflow", row: row.id, detail: `${row.overflowPx}px` });
  if (row.brokenImages?.length) findings.push({ severity: "high", type: "broken-image", row: row.id, detail: row.brokenImages.join(", ") });
  if (row.consoleErrors.length) findings.push({ severity: "high", type: "console", row: row.id, detail: row.consoleErrors.slice(0, 3).join(" | ") });
  if (row.pageErrors.length) findings.push({ severity: "high", type: "pageerror", row: row.id, detail: row.pageErrors.slice(0, 3).join(" | ") });
  if (row.httpErrors.length) findings.push({ severity: "medium", type: "subresource", row: row.id, detail: row.httpErrors.slice(0, 3).join(" | ") });
  if (row.role && row.activeNav === 0 && row.route.startsWith("/app/")) findings.push({ severity: "low", type: "active-nav", row: row.id, detail: "nessun elemento aria-current/data-active" });
  if (row.route === "/" && row.lang === "en" && row.botGreeting && /Ciao!|Ciao!/i.test(row.botGreeting)) findings.push({ severity: "medium", type: "i18n-bot", row: row.id, detail: row.botGreeting.slice(0, 140) });
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  phase: PHASE,
  base: BASE,
  screenshots: rows.length,
  profiles: [...PUBLIC_PROFILES, ...APP_PROFILES].map((p) => p.name),
  routes: [...PUBLIC_ROUTES, ...APP_ROUTES].map((r) => r.path),
  rows,
  findings,
};
writeFileSync(join(OUT, "audit.json"), `${JSON.stringify(report, null, 2)}\n`);
const lines = [
  `# Audit visivo/funzionale — Offcut 2.1 (${PHASE})`,
  "",
  "- Browser: Chromium headless, sessioni isolate per profilo, accesso demo una volta per profilo app.",
  `- Screenshot: ${rows.length}`,
  `- Finding: ${findings.length}`,
  "",
  "| ID | Route | Ruolo | Profilo | Status | H1 | Testo | Overflow | Errori console |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map((r) => `| ${r.id} | ${r.route} | ${r.role || "public"} | ${r.profile} | ${r.status || "-"} | ${(r.h1 || "").replace(/\|/g, "/").slice(0, 60)} | ${r.textLength || "-"} | ${r.overflowPx ?? "-"} | ${r.consoleErrors.length} |`),
  "",
  "## Finding",
  "",
  ...(findings.length ? findings.map((f) => `- **${f.severity}** [${f.type}] row ${f.row}: ${f.detail}`) : ["Nessun finding rilevato."]),
  "",
];
writeFileSync(join(OUT, `AUDIT_${PHASE.toUpperCase()}.md`), lines.join("\n"));
console.log(`[audit-v21:${PHASE}] ${rows.length} screenshot, ${findings.length} finding`);
if (findings.some((f) => f.severity === "high")) process.exitCode = 1;
