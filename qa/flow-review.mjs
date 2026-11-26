import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "qa");
const BASE = "http://127.0.0.1:3100";
const TITLE = "Ritagli OCC kraft 90/10";
const LISTING_ID = "lst_occ";
const DRAFT_KEY = "offcut.listing.draft.v1";

function loadPlaywright() {
  const candidates = [];
  for (const name of ["playwright", "playwright-core"]) {
    try {
      candidates.push(require.resolve(name));
    } catch {}
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
const results = [];
const failures = [];

async function newSession(lang) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ nextLang }) => {
    try {
      localStorage.setItem("circularlink.lang", nextLang);
      localStorage.setItem("circularlink-theme", "light");
    } catch {}
  }, { nextLang: lang });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const demo = page.locator(
    lang === "it" ? 'button[aria-label*="fornitore"]' : 'button[aria-label*="supplier"]',
  ).first();
  await demo.waitFor({ state: "visible", timeout: 15000 });
  await demo.click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20000 });
  await page.waitForSelector(".offcut-app-links a", { timeout: 15000 });
  return { context, page };
}

async function appState(page) {
  const raw = await page.evaluate(() => localStorage.getItem("circularlink-state-v1"));
  assert.ok(raw, "stato applicativo non trovato");
  return JSON.parse(raw).state;
}

async function listingById(page, id) {
  return (await appState(page)).listings.find((item) => item.id === id);
}

async function openListingAction(page, action) {
  await page.goto(`${BASE}/app/listings`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("tbody tr", { state: "attached", timeout: 15000 });
  const row = page.locator("tbody tr", { hasText: TITLE }).first();
  await row.locator('button[aria-label*="Azioni"], button[aria-label*="actions"]').first().click();
  await page.getByText(action, { exact: true }).click();
  await page.waitForURL(/\/app\/listings\/new/, { timeout: 20000 });
  await page.waitForTimeout(250);
}

async function wizardDraft(page) {
  const raw = await page.evaluate((key) => localStorage.getItem(key), DRAFT_KEY);
  assert.ok(raw, "bozza wizard non trovata");
  return JSON.parse(raw);
}

async function walkWizard(page, { finalButton, newTitle } = {}) {
  for (let step = 0; step < 5; step += 1) {
    if (newTitle && step === 1) await page.locator("#listing-title").fill(newTitle);
    await page.getByRole("button", { name: /^(Continua|Continue)$/ }).click();
    await page.waitForTimeout(120);
  }
  await page.getByRole("button", { name: finalButton, exact: true }).click();
  await page.waitForURL(/\/app\/listings$/, { timeout: 20000 });
  await page.waitForTimeout(250);
}

function record(name, detail) {
  results.push({ name, status: "PASS", detail });
  console.log(`[flow] PASS ${name}: ${detail}`);
}

function fail(name, error) {
  failures.push({ name, error: error instanceof Error ? error.message : String(error) });
  console.error(`[flow] FAIL ${name}: ${error}`);
}

/* ---------- 1. Modifica annuncio esistente (IT) ---------- */

let it;
try {
  it = await newSession("it");
  const before = await listingById(it.page, LISTING_ID);
  assert.ok(before, "annuncio seed mancante");

  await openListingAction(it.page, "Modifica materiali");
  const draft = await wizardDraft(it.page);
  assert.equal(draft.editingId, LISTING_ID);
  assert.equal(draft.title, before.title);
  assert.equal(draft.category, before.category);
  assert.deepEqual(draft.conditionFlags, before.conditionFlags ?? [before.condition]);
  assert.deepEqual(draft.composition, before.composition);
  assert.equal(draft.quantityKg, String(before.quantityKg));
  assert.equal(draft.minOrderKg, String(before.minOrderKg));
  assert.equal(draft.pricePerKg, String(before.pricePerKg));
  assert.equal(draft.locationId, before.locationId);
  assert.equal(draft.packaging, before.packaging);
  assert.deepEqual(draft.handling, before.handling);
  assert.deepEqual(draft.photos, before.photos);
  record("Prefill modifica IT", `${draft.title}; editingId=${draft.editingId}; campi chiave allineati`);

  const editedTitle = `${TITLE} — QA`;
  await walkWizard(it.page, { finalButton: "Salva modifiche", newTitle: editedTitle });
  const after = await listingById(it.page, LISTING_ID);
  assert.equal(after.title, editedTitle);
  assert.equal(after.reference, before.reference);
  assert.equal(after.orgId, before.orgId);
  assert.equal(after.status, before.status);
  assert.equal(after.createdAt, before.createdAt);
  assert.equal(after.views, before.views);
  assert.equal(after.pricePerKg, before.pricePerKg);
  assert.equal(after.quantityKg, before.quantityKg);
  assert.equal(after.composition[0].percent, before.composition[0].percent);
  assert.equal(await it.page.evaluate((key) => localStorage.getItem(key), DRAFT_KEY), null);
  record("Salvataggio modifica IT", `titolo aggiornato; riferimento=${after.reference}; stato=${after.status}; org=${after.orgId}`);

  await it.page.reload({ waitUntil: "domcontentloaded" });
  await it.page.waitForSelector(".offcut-app-links a", { timeout: 15000 });
  const reloaded = await listingById(it.page, LISTING_ID);
  assert.equal(reloaded.title, editedTitle);
  assert.equal(reloaded.reference, before.reference);
  record("Persistenza dopo refresh", `${reloaded.title}; riferimento invariato`);
} catch (error) {
  fail("Modifica annuncio IT", error);
} finally {
  await it?.context.close().catch(() => {});
}

/* ---------- 2. Duplicazione in bozza (EN) ---------- */

let en;
try {
  en = await newSession("en");
  const before = await listingById(en.page, LISTING_ID);
  await openListingAction(en.page, "Duplicate as draft");
  const draft = await wizardDraft(en.page);
  assert.equal(draft.editingId, undefined);
  assert.equal(draft.title, `${TITLE} (copy)`);
  assert.equal(draft.category, before.category);
  assert.equal(draft.pricePerKg, String(before.pricePerKg));
  assert.equal(draft.locationId, before.locationId);
  record("Prefill duplicazione EN", `${draft.title}; editingId assente`);

  await walkWizard(en.page, { finalButton: "Save draft" });
  const state = await appState(en.page);
  const copy = state.listings.find((item) => item.title === `${TITLE} (copy)`);
  assert.ok(copy, "bozza duplicata non trovata");
  assert.equal(copy.status, "draft");
  assert.equal(copy.orgId, before.orgId);
  assert.notEqual(copy.id, LISTING_ID);
  assert.notEqual(copy.reference, before.reference);
  assert.equal(copy.pricePerKg, before.pricePerKg);
  assert.equal(await en.page.evaluate((key) => localStorage.getItem(key), DRAFT_KEY), null);
  record("Duplicazione salvata EN", `id=${copy.id}; riferimento=${copy.reference}; stato=${copy.status}`);
} catch (error) {
  fail("Duplicazione annuncio EN", error);
} finally {
  await en?.context.close().catch(() => {});
}

await browser.close();

mkdirSync(OUT, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  results,
  failures,
};
writeFileSync(join(OUT, "flows.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  "# Verifica flussi annunci",
  "",
  `Generato: ${report.generatedAt} · Base: ${BASE}`,
  "",
  "| Verifica | Stato | Evidenza |",
  "| --- | --- | --- |",
  ...results.map((r) => `| ${r.name} | ${r.status} | ${r.detail} |`),
  "",
  failures.length ? `## Errori\n\n${failures.map((f) => `- ${f.name}: ${f.error}`).join("\n")}` : "## Errori\n\nNessuno.",
  "",
  "Nota: stato e scritture sono confinati al localStorage del contesto di test; nessuna modifica al server o alla produzione.",
  "",
].join("\n");
writeFileSync(join(OUT, "FLOW_REPORT.md"), markdown);

if (failures.length) process.exitCode = 1;
console.log(`[flow] ${results.length} verifiche PASS, ${failures.length} errori`);
console.log(`[flow] report: ${join(OUT, "FLOW_REPORT.md")}`);
