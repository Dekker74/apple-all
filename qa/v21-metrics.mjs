#!/usr/bin/env node
/**
 * Offcut 2.1 layout metrics. Read-only.
 * Usage: node qa/v21-metrics.mjs [--phase before|after]
 */
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const args = new Map();
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith("--")) continue;
  const eq = arg.indexOf("=");
  if (eq >= 0) {
    args.set(arg.slice(2, eq), arg.slice(eq + 1));
  } else {
    const next = argv[i + 1];
    args.set(arg.slice(2), next && !next.startsWith("--") ? argv[++i] : true);
  }
}
const PHASE = String(args.get("phase") || "before");
const OUT = join(ROOT, "qa", "audit-v2.1", PHASE);
const BASE = String(process.env.QA_BASE_URL || "http://127.0.0.1:3100").replace(/\/$/, "");
mkdirSync(OUT, { recursive: true });

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

const VIEWPORTS = [
  { name: "360", width: 360, height: 780 },
  { name: "375", width: 375, height: 812 },
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const ROUTES = [
  { path: "/", name: "home", role: null },
  { path: "/app/dashboard", name: "dashboard", role: "buyer" },
  { path: "/app/marketplace", name: "marketplace", role: "buyer" },
];

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

const rows = [];
for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    await context.addInitScript(() => {
      try {
        localStorage.setItem("offcut.lang", "it");
        localStorage.setItem("offcut-theme", "light");
        localStorage.setItem("circularlink.lang", "it");
        localStorage.setItem("circularlink-theme", "light");
      } catch {}
    });
    const page = await context.newPage();
    try {
      if (route.role) await signIn(page, route.role);
      const res = await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {});
      const data = await page.evaluate(() => {
        const rect = (el) => {
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x), y: Math.round(r.y + window.scrollY),
            w: Math.round(r.width), h: Math.round(r.height),
          };
        };
        const sections = [...document.querySelectorAll("section")].map((s, i) => ({
          index: i + 1,
          id: s.id || "",
          height: Math.round(s.getBoundingClientRect().height),
          label: (s.getAttribute("aria-labelledby") || ""),
        }));
        const targets = [...document.querySelectorAll("a[href], button, summary, [role=button]")]
          .filter((el) => {
            if (el.closest(".sr-only")) return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
          })
          .map((el) => ({ tag: el.tagName, text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 50), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
        const fixed = [...document.querySelectorAll("#chat-widget, #chat-panel, #chat-toggle, [class*='fixed']")]
          .filter((el) => getComputedStyle(el).position === "fixed")
          .slice(0, 8)
          .map((el) => ({ selector: el.id || el.className.toString().slice(0, 80), ...rect(el) }));
        return {
          status: document.readyState,
          title: document.title,
          scrollHeight: document.documentElement.scrollHeight,
          scrollWidth: document.documentElement.scrollWidth,
          innerHeight: window.innerHeight,
          innerWidth: window.innerWidth,
          overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
          textLength: (document.body.innerText || "").trim().length,
          sections,
          sectionCount: sections.length,
          h1: (document.querySelector("h1")?.innerText || "").trim().slice(0, 120),
          h2Count: document.querySelectorAll("h2").length,
          imageCount: document.images.length,
          smallTargets: targets.filter((t) => t.h < 24 || t.w < 24).slice(0, 12),
          smallTargetCount: targets.filter((t) => t.h < 24 || t.w < 24).length,
          fixed,
        };
      });
      rows.push({ viewport: vp.name, route: route.name, role: route.role, httpStatus: res?.status() || 0, ...data });
    } catch (err) {
      rows.push({ viewport: vp.name, route: route.name, role: route.role, fatal: String(err.message || err).slice(0, 240) });
    } finally {
      await context.close().catch(() => {});
    }
  }
}
await browser.close();

const homeRows = rows.filter((r) => r.route === "home" && !r.fatal);
const byVp = Object.fromEntries(homeRows.map((r) => [r.viewport, r.scrollHeight]));
const report = {
  generatedAt: new Date().toISOString(),
  phase: PHASE,
  base: BASE,
  homeScrollHeightByViewport: byVp,
  rows,
};
writeFileSync(join(OUT, "metrics.json"), `${JSON.stringify(report, null, 2)}\n`);
const lines = [
  `# Metriche layout Offcut 2.1 — fase ${PHASE}`,
  "",
  "- Browser: Chromium headless, `prefers-reduced-motion: reduce`, tema chiaro, IT.",
  `- Home scrollHeight: ${Object.entries(byVp).map(([vp, h]) => `${vp}px=${h}`).join(" · ")}`,
  "",
  "| Viewport | Route | Status |scrollHeight | overflow | sezioni | H2 | target <24px |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map((r) => `| ${r.viewport} | ${r.route} | ${r.httpStatus || "-"} | ${r.scrollHeight ?? "-"} | ${r.overflowPx ?? "-"} | ${r.sectionCount ?? "-"} | ${r.h2Count ?? "-"} | ${r.smallTargetCount ?? "-"} |`),
  "",
];
writeFileSync(join(OUT, "METRICS.md"), lines.join("\n"));
console.log(`[metrics:${PHASE}] ${rows.length} misurazioni`);
