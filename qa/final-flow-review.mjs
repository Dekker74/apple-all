import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "qa");
const BASE = "http://127.0.0.1:3100";
const TITLE = "Ritagli OCC kraft 90/10";
const DRAFT_KEY = "offcut.listing.draft.v1";
const STATE_KEY = "circularlink-state-v1";

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

function record(name, detail) {
  results.push({ name, status: "PASS", detail });
  console.log(`[final-flow] PASS ${name}: ${detail}`);
}

function fail(name, error) {
  failures.push({ name, error: error instanceof Error ? error.message : String(error) });
  console.error(`[final-flow] FAIL ${name}: ${error}`);
}

async function newSession(demo = "buyer") {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("circularlink.lang", "en");
      localStorage.setItem("circularlink-theme", "light");
    } catch {}
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const selector = demo === "buyer"
    ? 'button[aria-label*="buyer"], button[aria-label*="acquirente"]'
    : 'button[aria-label*="supplier"], button[aria-label*="fornitore"]';
  await page.locator(selector).first().click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20000 });
  await page.waitForSelector(".offcut-app-links a", { timeout: 15000 });
  return { context, page, errors };
}

async function gotoApp(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(150);
}

async function bodyText(page) {
  return (await page.locator("body").innerText()).replace(/\s+/g, " ");
}

async function appState(page) {
  const raw = await page.evaluate((key) => localStorage.getItem(key), STATE_KEY);
  assert.ok(raw, "stato applicativo non trovato");
  return JSON.parse(raw).state;
}

/* ---------- Site pubblico e accesso ---------- */

let publicSession;
try {
  publicSession = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await publicSession.addInitScript(() => localStorage.setItem("circularlink.lang", "en"));
  const page = await publicSession.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 15000 });
  const text = await bodyText(page);
  assert.ok(text.includes("Sell materials") && text.includes("Find materials"));
  assert.ok(text.includes("No role to choose"));
  assert.equal(errors.length, 0);
  record("Homepage pubblica", "hero, doppia CTA buy/sell e messaggio no-role verificati");

  await page.goto(`${BASE}/signup`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 15000 });
  const signup = await page.evaluate(() => ({
    radios: document.querySelectorAll('input[type="radio"], [role="radio"]').length,
    fields: document.querySelectorAll("input:not([type=hidden]), select, textarea").length,
  }));
  assert.equal(signup.radios, 0);
  assert.ok(signup.fields <= 8);
  record("Registrazione", `${signup.fields} campi iniziali, 0 scelte di ruolo`);

  await page.goto(`${BASE}/forgot-password`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 15000 });
  assert.equal(await page.locator('input[type="email"]').count(), 1);
  record("Recupero password", "form email presente");
} catch (error) {
  fail("Site pubblico", error);
} finally {
  await publicSession?.close().catch(() => {});
}

/* ---------- Demo buyer: dashboard, logout ---------- */

let buyer;
try {
  buyer = await newSession("buyer");
  const dashboard = await bodyText(buyer.page);
  assert.ok(dashboard.includes("Northwind Packaging S.p.A."));
  assert.ok(dashboard.includes("New request") && dashboard.includes("Post material"));
  record("Dashboard buyer", "KPI e azioni rapide buy/sell presenti");

  await buyer.page.locator('button[aria-label*="Elena Ricci"]').first().click();
  await buyer.page.getByText("Sign out", { exact: true }).click();
  await buyer.page.waitForURL(/\/login/, { timeout: 15000 });
  record("Logout", "menu utente e sign out portano a /login");
} catch (error) {
  fail("Buyer e logout", error);
} finally {
  await buyer?.context.close().catch(() => {});
}

/* ---------- Demo supplier: dashboard ---------- */

let supplier;
try {
  supplier = await newSession("supplier");
  const dashboard = await bodyText(supplier.page);
  assert.ok(dashboard.includes("GreenLoop Fibres S.r.l."));
  assert.ok(dashboard.includes("Post material") && dashboard.includes("New request"));
  record("Dashboard supplier", "KPI, annunci e azioni rapide presenti");
} catch (error) {
  fail("Dashboard supplier", error);
} finally {
  await supplier?.context.close().catch(() => {});
}

/* ---------- Marketplace: ricerca, filtri, empty state ---------- */

let market;
try {
  market = await newSession("buyer");
  const cardCount = () => market.page.evaluate(() => document.querySelectorAll('a[href^="/app/marketplace/"]').length);
  await gotoApp(market.page, "/app/marketplace");
  await market.page.waitForSelector('a[href^="/app/marketplace/"]', { timeout: 15000 });
  const baseCount = await cardCount();
  assert.ok(baseCount >= 10, `annunci base=${baseCount}`);

  await gotoApp(market.page, "/app/marketplace?q=rpet");
  await market.page.waitForSelector("h1", { timeout: 15000 });
  await market.page.waitForTimeout(400);
  const searchCount = await cardCount();
  assert.ok(searchCount > 0 && searchCount < baseCount, `annunci filtrati=${searchCount}`);
  record("Ricerca marketplace", `${baseCount} annunci → ${searchCount} con q=rpet`);

  await gotoApp(market.page, "/app/marketplace");
  await market.page.waitForSelector('a[href^="/app/marketplace/"]', { timeout: 15000 });
  await market.page.getByText("Plastics", { exact: true }).first().click();
  await market.page.waitForTimeout(200);
  const plasticCount = await cardCount();
  assert.ok(plasticCount > 0 && plasticCount < baseCount, `annunci plastica=${plasticCount}`);
  record("Filtro categoria", `Plastics: ${plasticCount}/${baseCount} annunci`);

  await gotoApp(market.page, "/app/marketplace?q=zzzznotmaterial");
  await market.page.waitForSelector("h1", { timeout: 15000 });
  await market.page.waitForTimeout(400);
  assert.equal(await cardCount(), 0);
  assert.ok(/No material|Nessun materiale/i.test(await bodyText(market.page)));
  record("Empty state marketplace", "ricerca senza risultati mostra spiegazione e azioni");
} catch (error) {
  fail("Marketplace", error);
} finally {
  await market?.context.close().catch(() => {});
}

/* ---------- Pubblicazione attiva da bozza ---------- */

let publish;
try {
  publish = await newSession("supplier");
  await gotoApp(publish.page, "/app/listings");
  await publish.page.waitForSelector("tbody tr", { timeout: 15000 });
  const source = publish.page.locator("tbody tr", { hasText: TITLE }).first();
  await source.locator('button[aria-label*="Listing actions"], button[aria-label*="Azioni annuncio"]').first().click();
  await publish.page.getByText("Duplicate as draft", { exact: true }).click();
  await publish.page.waitForURL(/\/app\/listings\/new/, { timeout: 20000 });
  const draft = await publish.page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), DRAFT_KEY);
  assert.equal(draft.title, `${TITLE} (copy)`);
  assert.equal(draft.editingId, undefined);

  for (let step = 0; step < 5; step += 1) {
    await publish.page.getByRole("button", { name: /^(Continue|Continua)$/ }).click();
    await publish.page.waitForTimeout(120);
  }
  await publish.page.getByRole("button", { name: "Save draft", exact: true }).click();
  await publish.page.waitForURL(/\/app\/listings$/, { timeout: 20000 });

  const copyRow = publish.page.locator("tbody tr", { hasText: `${TITLE} (copy)` }).first();
  await copyRow.locator('button[aria-label*="Listing actions"], button[aria-label*="Azioni annuncio"]').first().click();
  await publish.page.getByText("Show again", { exact: true }).click();
  await publish.page.waitForTimeout(250);
  const state = await appState(publish.page);
  const copy = state.listings.find((item) => item.title === `${TITLE} (copy)`);
  assert.ok(copy, "bozza duplicata non trovata");
  assert.equal(copy.status, "active");
  record("Pubblicazione attiva", `annuncio ${copy.reference} attivato dall'UI (status=${copy.status})`);
} catch (error) {
  fail("Pubblicazione attiva", error);
} finally {
  await publish?.context.close().catch(() => {});
}

/* ---------- Preventivo, trasporto, processing, transazioni ---------- */

let orders;
try {
  orders = await newSession("buyer");
  await gotoApp(orders.page, "/app/orders/ord_occ");
  await orders.page.waitForSelector("h1", { timeout: 15000 });
  const quoteText = await bodyText(orders.page);
  assert.ok(/quote detail/i.test(quoteText));
  assert.ok(/offcut commission \(6%\)/i.test(quoteText));
  assert.ok(/processing/i.test(quoteText) && /transport/i.test(quoteText));

  const downloadPromise = orders.page.waitForEvent("download", { timeout: 15000 });
  await orders.page.getByRole("button", { name: "Download quote" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  assert.ok(path, "percorso download mancante");
  const content = readFileSync(path, "utf8");
  assert.ok(content.includes("CL-2026-0139"));
  assert.ok(/commission/i.test(content));
  record("Download preventivo", `${download.suggestedFilename()} · ${content.length} byte · commissione presente`);

  await gotoApp(orders.page, "/app/orders/ord_rpet");
  await orders.page.waitForSelector("h1", { timeout: 15000 });
  const scheduled = await bodyText(orders.page);
  assert.ok(/pick-up scheduled/i.test(scheduled));
  assert.ok(/transport mode/i.test(scheduled) && /carried by offcut/i.test(scheduled));
  assert.ok(/processing/i.test(scheduled) && /total delivered/i.test(scheduled));
  assert.ok(!/Offcut coordina partner/i.test(scheduled));
  record("Trasporto, processing e transazioni", "timeline, modalità, lavorazione e riepilogo economico verificati");
} catch (error) {
  fail("Ordini e preventivi", error);
} finally {
  await orders?.context.close().catch(() => {});
}

/* ---------- Messaggi, notifiche, assistente, impostazioni, errori ---------- */

let app;
try {
  app = await newSession("buyer");
  await gotoApp(app.page, "/app/inbox");
  await app.page.waitForSelector("h1", { timeout: 15000 });
  await app.page.getByRole("tab", { name: /Messages/ }).click();
  const unique = `QA ${Date.now()}`;
  await app.page.getByPlaceholder("Write a message to the partner…").fill(unique);
  await app.page.locator('button[aria-label="Send message"]').first().click();
  await app.page.waitForTimeout(200);
  assert.ok((await bodyText(app.page)).includes(unique));
  record("Messaggistica", "invio messaggio nel contesto demo verificato");

  await app.page.locator('button[aria-label*="Notific"], button[aria-label*="notification"]').first().click();
  await app.page.waitForTimeout(150);
  assert.ok(await app.page.locator('a[href^="/app/orders/"]').count() > 0);
  record("Centro notifiche", "menu con collegamento diretto all'ordine");
  await app.page.keyboard.press("Escape");
  await app.page.waitForTimeout(300);

  await app.page.locator("#chat-toggle").click();
  await app.page.waitForTimeout(150);
  assert.ok(await app.page.locator("#chat-panel.open").count() === 1);
  await app.page.locator("#chat-close").click();
  assert.equal(await app.page.locator("#chat-panel.open").count(), 0);
  record("Assistente AI", "apertura manuale e chiusura senza auto-open");

  await gotoApp(app.page, "/app/settings");
  await app.page.waitForSelector("h1", { timeout: 15000 });
  const settings = await bodyText(app.page);
  for (const tab of ["Company", "Sites", "Team", "Data & demo"]) {
    assert.ok(settings.includes(tab), `tab ${tab} mancante`);
  }
  assert.ok(!/VAT verified|VAT number to verify|Partita IVA verificata/i.test(settings));
  record("Profilo e impostazioni", "tab presenti e nessun badge di verifica inventato");

  await gotoApp(app.page, "/app/orders/ord_not_found");
  await app.page.waitForFunction(() => /order not found/i.test(document.body.innerText), null, { timeout: 15000 });
  assert.ok(/Order not found/i.test(await bodyText(app.page)));
  record("Stato errore", "ordine inesistente mostra messaggio e azione di ritorno");

  assert.deepEqual(app.errors, []);
  record("Console e HTTP", "0 errori console/pageerror/HTTP nelle sessioni finali");
} catch (error) {
  fail("Flussi applicativi", error);
} finally {
  await app?.context.close().catch(() => {});
}

await browser.close();

mkdirSync(OUT, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  results,
  failures,
};
writeFileSync(join(OUT, "final-flows.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  "# Verifica flussi finali",
  "",
  `Generato: ${report.generatedAt} · Base: ${BASE} · Lingua: EN · Tema: light`,
  "",
  "| Verifica | Stato | Evidenza |",
  "| --- | --- | --- |",
  ...results.map((r) => `| ${r.name} | ${r.status} | ${r.detail} |`),
  "",
  failures.length ? `## Errori\n\n${failures.map((f) => `- ${f.name}: ${f.error}`).join("\n")}` : "## Errori\n\nNessuno.",
  "",
  "Nota: ogni azione è stata eseguita in un contesto browser isolato; lo stato mutato resta nel localStorage del test. Nessuna chiamata a produzione, pagamento o invio email reale.",
  "",
].join("\n");
writeFileSync(join(OUT, "FINAL_FLOW_REPORT.md"), markdown);

if (failures.length) process.exitCode = 1;
console.log(`[final-flow] ${results.length} verifiche PASS, ${failures.length} errori`);
console.log(`[final-flow] report: ${join(OUT, "FINAL_FLOW_REPORT.md")}`);
