import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "..");
const BASE = process.env.BASE_URL || "https://apple-all.vercel.app";
const OUT = join(ROOT, "qa", "visual-before");

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

const shots = [
  { name: "before-home-desktop-light-en", width: 1440, height: 900, path: "/", fullPage: true },
  { name: "before-home-mobile-light-en", width: 390, height: 844, path: "/", fullPage: true },
  { name: "before-impact-desktop-light-en", width: 1440, height: 900, path: "/impatto", fullPage: false },
  { name: "before-quote-desktop-light-en", width: 1440, height: 900, path: "/preventivo", fullPage: false },
  { name: "before-login-desktop-light-en", width: 1440, height: 900, path: "/login", fullPage: false },
];

let failures = 0;
const only = process.env.SHOT;
for (const shot of shots) {
  if (only && shot.name !== only) continue;
  const context = await browser.newContext({ viewport: { width: shot.width, height: shot.height }, colorScheme: "light" });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("circularlink.lang", "en");
      localStorage.setItem("circularlink-theme", "light");
    } catch {}
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(`${BASE}${shot.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response || response.status() >= 400) throw new Error(`HTTP ${response?.status() ?? "nessuna risposta"}`);
    await page.waitForSelector("h1, h2, main", { state: "visible", timeout: 20000 });
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, `${shot.name}.png`), fullPage: Boolean(shot.fullPage) });
    console.log(`[visual-before] ${shot.name}`);
  } catch (error) {
    failures += 1;
    console.error(`[visual-before] FAIL ${shot.name}: ${error.message}`);
  } finally {
    await context.close().catch(() => {});
  }
}

await browser.close();
if (failures) process.exitCode = 1;
console.log(`[visual-before] ${shots.length - failures}/${shots.length} screenshot, ${failures} errori`);
