import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "qa", "visual-review");

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
mkdirSync(OUT, { recursive: true });

async function newContext({ width, height, lang = "it", theme = "light" }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme });
  await context.addInitScript(({ lang, theme }) => {
    try {
      localStorage.setItem("circularlink.lang", lang);
      localStorage.setItem("circularlink-theme", theme);
    } catch {}
  }, { lang, theme });
  return context;
}

async function prepare(page, path, { auth = false, fullPage = false } = {}) {
  await page.goto(`http://127.0.0.1:3100/login`, { waitUntil: "domcontentloaded" });
  if (auth) {
    const demo = page.locator('button[aria-label*="buyer"], button[aria-label*="acquirente"]').first();
    await demo.waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(250);
    await demo.click();
    await page.waitForURL(/\/app\/dashboard/, { waitUntil: "domcontentloaded", timeout: 20000 });
  }
  await page.goto(`http://127.0.0.1:3100${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
  await page.evaluate(async () => {
    for (const img of [...document.images].filter((image) => image.loading === "lazy")) {
      img.scrollIntoView({ block: "center", inline: "nearest" });
      if (!img.complete) {
        await Promise.race([
          new Promise((done) => {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
          new Promise((done) => setTimeout(done, 300)),
        ]);
      }
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(350);
}

const shots = [
  { name: "home-desktop-light-en", width: 1440, height: 900, lang: "en", theme: "light", path: "/", fullPage: true },
  { name: "home-desktop-dark-it", width: 1440, height: 900, lang: "it", theme: "dark", path: "/", fullPage: false },
  { name: "home-tablet-light-it", width: 768, height: 1024, lang: "it", theme: "light", path: "/", fullPage: false },
  { name: "home-mobile-light-it", width: 390, height: 844, lang: "it", theme: "light", path: "/", fullPage: true },
  { name: "dashboard-desktop-light-it", width: 1440, height: 900, lang: "it", theme: "light", path: "/app/dashboard", auth: true },
  { name: "marketplace-tablet-light-en", width: 768, height: 1024, lang: "en", theme: "light", path: "/app/marketplace", auth: true },
  { name: "marketplace-mobile-dark-it", width: 390, height: 844, lang: "it", theme: "dark", path: "/app/marketplace", auth: true },
  { name: "detail-desktop-light-en", width: 1440, height: 900, lang: "en", theme: "light", path: "/app/marketplace/lst_occ", auth: true },
  { name: "wizard-tablet-light-it", width: 768, height: 1024, lang: "it", theme: "light", path: "/app/listings/new", auth: true },
  { name: "quote-desktop-light-it", width: 1440, height: 900, lang: "it", theme: "light", path: "/preventivo" },
  { name: "impact-mobile-light-en", width: 390, height: 844, lang: "en", theme: "light", path: "/impatto" },
  { name: "login-mobile-dark-it", width: 390, height: 844, lang: "it", theme: "dark", path: "/login" },
  { name: "inbox-desktop-dark-en", width: 1440, height: 900, lang: "en", theme: "dark", path: "/app/inbox", auth: true },
  { name: "settings-tablet-light-it", width: 768, height: 1024, lang: "it", theme: "light", path: "/app/settings", auth: true },
];

let failures = 0;
const only = process.env.SHOT;
for (const shot of shots) {
  if (only && shot.name !== only) continue;
  const context = await newContext(shot);
  const page = await context.newPage();
  try {
    await prepare(page, shot.path, { auth: shot.auth, fullPage: shot.fullPage });
    const target = join(OUT, `${shot.name}.png`);
    await page.screenshot({ path: target, fullPage: Boolean(shot.fullPage) });
    console.log(`[visual] ${shot.name}`);
  } catch (err) {
    failures += 1;
    console.error(`[visual] FAIL ${shot.name}: ${err.message}`);
  } finally {
    await context.close().catch(() => {});
  }
}

await browser.close();
if (failures) process.exitCode = 1;
console.log(`[visual] ${shots.length - (only ? 1 : 0) - failures}/${only ? 1 : shots.length} screenshot, ${failures} errori`);
