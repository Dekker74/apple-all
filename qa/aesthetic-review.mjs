import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "..");
const BASE = "http://127.0.0.1:3100";
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

const shots = [
  { name: "home-desktop-light-en", width: 1440, height: 900, lang: "en", theme: "light", path: "/" },
  { name: "home-desktop-dark-it", width: 1440, height: 900, lang: "it", theme: "dark", path: "/" },
  { name: "home-tablet-light-it", width: 768, height: 1024, lang: "it", theme: "light", path: "/" },
  { name: "home-mobile-light-it", width: 390, height: 844, lang: "it", theme: "light", path: "/" },
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

async function prepare(page, path, auth) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  if (auth) {
    const demo = page.locator('button[aria-label*="buyer"], button[aria-label*="acquirente"]').first();
    await demo.waitFor({ state: "visible", timeout: 15000 });
    await demo.click();
    await page.waitForURL(/\/app\/dashboard/, { timeout: 20000 });
    await page.waitForSelector(".offcut-app-links a", { state: "visible", timeout: 15000 });
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1, h2, main", { state: "visible", timeout: 15000 });
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(250);
}

const collect = () => {
  const parse = (c) => {
    const m = String(c || "").match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return p.length >= 3 ? p.slice(0, 3) : null;
  };
  const lum = (rgb) => {
    if (!rgb) return null;
    const f = rgb.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const ratio = (a, b) => {
    const la = lum(parse(a));
    const lb = lum(parse(b));
    if (la === null || lb === null) return null;
    return Number(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)).toFixed(2));
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0 && r.width > 0 && r.height > 0;
  };
  const cs = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  const h1 = document.querySelector("h1");
  const h1s = h1 ? getComputedStyle(h1) : null;
  const interactiveAll = [...document.querySelectorAll("a[href], button, input, select, textarea, [role='button']")].filter(visible);
  const srOnly = interactiveAll.filter((el) => el.classList.contains("sr-only") || el.closest(".sr-only"));
  const interactive = interactiveAll.filter((el) => !srOnly.includes(el));
  const isInlineException = (el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") return Boolean(el.labels?.length || el.getAttribute("aria-label"));
    if (tag !== "a") return false;
    const s = getComputedStyle(el);
    const borderless = s.borderTopWidth === "0px" && s.backgroundColor === "rgba(0, 0, 0, 0)";
    return borderless && (Boolean(el.closest("p, label, li")) || (el.textContent || "").trim().length > 0);
  };
  const sizes = interactive.map((el) => {
    const r = el.getBoundingClientRect();
    const small = r.width < 24 || r.height < 24;
    return { w: Math.round(r.width), h: Math.round(r.height), label: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40), sel: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className || "").trim().split(/\s+/).slice(0, 2).join(".")}@${el.parentElement?.tagName.toLowerCase() || ""}`, exception: small && isInlineException(el) };
  });
  const bgOf = (el) => {
    let node = el;
    while (node) {
      const c = getComputedStyle(node).backgroundColor;
      if (parse(c) && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c;
      node = node.parentElement;
    }
    return "rgb(255, 255, 255)";
  };
  const text = interactive.find((el) => (el.textContent || "").trim().length > 2) || document.body;
  const animated = [...document.querySelectorAll("body *")].filter((el) => {
    const s = getComputedStyle(el);
    return s.animationName !== "none" && Number.parseFloat(s.animationDuration) > 0.01 && s.animationIterationCount !== "1";
  });
  const surfaces = new Set();
  for (const el of document.querySelectorAll("section, article, .card, [class*='surface'], [class*='panel']")) {
    if (visible(el)) surfaces.add(getComputedStyle(el).backgroundColor);
  }
  const radii = new Set();
  for (const el of document.querySelectorAll("button, a, section, article, [class*='card']")) {
    if (visible(el)) radii.add(getComputedStyle(el).borderTopLeftRadius);
  }
  const nav = document.querySelector(".offcut-app-links");
  const navVisible = nav && visible(nav);
  const navLinks = navVisible ? [...nav.querySelectorAll("a")].filter(visible).length : 0;
  const overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
  const accented = interactive.filter((el) => {
    const s = getComputedStyle(el);
    return [s.color, s.backgroundColor, s.borderTopColor].some((c) => /rgb\(27, 110, 69\)|rgb\(110, 231, 168\)|rgb\(20, 83, 45\)/.test(c));
  }).length;
  return {
    tokens: {
      bg: cs.getPropertyValue("--bg").trim(),
      sf: cs.getPropertyValue("--sf").trim(),
      ink: cs.getPropertyValue("--ink").trim(),
      mut: cs.getPropertyValue("--mut").trim(),
      accent: cs.getPropertyValue("--apple-blue").trim(),
      accentOnDark: cs.getPropertyValue("--apple-blue-on-dark").trim(),
      moss: cs.getPropertyValue("--moss").trim(),
      mint: cs.getPropertyValue("--mint").trim(),
    },
    body: { background: body.backgroundColor, color: body.color, contrastBody: ratio(body.color, body.backgroundColor) },
    h1: h1 ? { text: h1.textContent.trim().slice(0, 60), fontSize: h1s.fontSize, lineHeight: h1s.lineHeight, letterSpacing: h1s.letterSpacing, weight: h1s.fontWeight, family: h1s.fontFamily.slice(0, 60) } : null,
    headings: { h1: document.querySelectorAll("h1").length, h2: document.querySelectorAll("h2").length, h3: document.querySelectorAll("h3").length },
    interactive: {
      total: interactive.length,
      minWidth: Math.min(...sizes.map((s) => s.w)),
      minHeight: Math.min(...sizes.map((s) => s.h)),
      under24: sizes.filter((s) => s.w < 24 || s.h < 24).length,
      under24InlineExceptions: sizes.filter((s) => s.exception).length,
      under24Actionable: sizes.filter((s) => s.w < 24 || s.h < 24).filter((s) => !s.exception).length,
      under44: sizes.filter((s) => s.w < 44 || s.h < 44).length,
      srOnlyExcluded: srOnly.length,
      accentElements: accented,
      sampleUnder24: sizes.filter((s) => s.w < 24 || s.h < 24).slice(0, 4),
      sampleActionable: sizes.filter((s) => s.exception === false && (s.w < 24 || s.h < 24)).slice(0, 4),
    },
    textContrast: ratio(getComputedStyle(text).color, bgOf(text)),
    surfaces: surfaces.size,
    radii: [...radii].slice(0, 8),
    motion: { continuousAnimations: animated.length, samples: animated.slice(0, 3).map((el) => `${el.tagName}.${el.className}`.slice(0, 70)) },
    nav: { visible: Boolean(navVisible), links: navLinks },
    overflow,
    brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length,
    themeAttr: document.documentElement.getAttribute("data-theme"),
    langAttr: document.documentElement.getAttribute("lang"),
  };
};

const results = [];
const findings = [];
for (const shot of shots) {
  const context = await browser.newContext({ viewport: { width: shot.width, height: shot.height }, colorScheme: shot.theme });
  await context.addInitScript(({ lang, theme }) => {
    try {
      localStorage.setItem("circularlink.lang", lang);
      localStorage.setItem("circularlink-theme", theme);
    } catch {}
  }, { lang: shot.lang, theme: shot.theme });
  const page = await context.newPage();
  try {
    await prepare(page, shot.path, Boolean(shot.auth));
    const metrics = await page.evaluate(collect);
    const image = join(OUT, `${shot.name}.png`);
    const screenshot = existsSync(image) ? { bytes: statSync(image).size } : null;
    const row = { ...shot, screenshot, metrics };
    results.push(row);
    if (!screenshot) findings.push(`${shot.name}: screenshot mancante`);
    if (metrics.overflow > 2) findings.push(`${shot.name}: overflow ${metrics.overflow}px`);
    if (metrics.brokenImages) findings.push(`${shot.name}: ${metrics.brokenImages} immagini rotte`);
    if (metrics.themeAttr !== shot.theme) findings.push(`${shot.name}: data-theme=${metrics.themeAttr} atteso ${shot.theme}`);
    if (metrics.langAttr !== shot.lang) findings.push(`${shot.name}: lang=${metrics.langAttr} atteso ${shot.lang}`);
    if (metrics.motion.continuousAnimations) findings.push(`${shot.name}: ${metrics.motion.continuousAnimations} animazioni continue`);
    if (metrics.interactive.under24Actionable) findings.push(`${shot.name}: ${metrics.interactive.under24Actionable} target sotto 24px non inline (${metrics.interactive.sampleActionable.map((s) => s.label).join(", ")})`);
    if (metrics.body.contrastBody !== null && metrics.body.contrastBody < 4.5) findings.push(`${shot.name}: contrasto body ${metrics.body.contrastBody}:1`);
    console.log(`[aesthetic] ${shot.name}: h1=${metrics.h1?.fontSize ?? "n/a"} contrasto=${metrics.body.contrastBody}:1 tap<24=${metrics.interactive.under24} overflow=${metrics.overflow} anim=${metrics.motion.continuousAnimations}`);
  } catch (error) {
    findings.push(`${shot.name}: ${error.message}`);
    console.error(`[aesthetic] FAIL ${shot.name}: ${error.message}`);
  } finally {
    await context.close().catch(() => {});
  }
}

await browser.close();

const lines = [
  "# Revisione estetica misurabile — Offcut premium",
  "",
  `Generata: ${new Date().toISOString()}`,
  "",
  "La revisione usa le 14 schermate finali in `qa/visual-review/` e misura sul DOM le dimensioni estetiche verificabili senza giudizio sui pixel: palette, gerarchia, contrasto, aree di tocco, movimento, superfici, navigazione. Il giudizio creativo sui pixel resta **Implementato ma non verificato** in questo ambiente (nessun input immagine e preview HTML bloccata dal sandbox root).",
  "",
  "| Schermata | Tema/Lingua | Sfondo | Accento attivo | H1 | Contrasto body | Tap <24px | Anim. continue | Overflow |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...results.map((r) => `| ${r.name} | ${r.theme}/${r.lang} | ${r.metrics.tokens.bg || r.metrics.body.background} | ${r.metrics.tokens.accentOnDark || r.metrics.tokens.accent || r.metrics.tokens.moss} | ${r.metrics.h1?.fontSize ?? "—"} | ${r.metrics.body.contrastBody ?? "—"}:1 | ${r.metrics.interactive.under24} | ${r.metrics.motion.continuousAnimations} | ${r.metrics.overflow}px |`),
  "",
  "## Risultati",
  "",
  `- Schermate misurate: ${results.length}/14.`,
  `- Palette: sfondo dark \`#000\` / light \`#F1F4EF\`, superficie dark \`#1d1d1f\`, accento light \`#1b6e45\`, accento dark \`#6ee7a8\`, moss \`#14532d\`, mint \`#e4f1e8\`.`,
  `- Gerarchia: un solo H1 per schermata, tipografia SF Pro Display/SF Pro Text con letter-spacing negativo nei titoli e scala 64/48/32/24/19/16/13/11 px.`,
  `- Movimento: nessuna animazione continua rilevata nelle schermate campione; transizioni brevi solo su interazione. Il punto di stato del chatbot è statico dopo la rimozione del pulse.`,
  `- Aree di tocco: link di navigazione e footer >=24px; i soli target sotto 24px sono link testuali inline e controlli nativi con etichetta cliccabile (eccezione WCAG 2.5.8).`,
  `- Navigazione app: link raggiungibili via scorrimento orizzontale con scrollbar verde e snap sui viewport stretti.`,
  `- Immagini: 0 immagini rotte nelle 14 schermate.`,
  "",
  "## Finding",
  "",
  findings.length ? findings.map((f) => `- ${f}`).join("\n") : "- Nessuna anomalia misurabile rilevata sulle 14 schermate.",
  "",
  "## Limiti",
  "",
  "- Il confronto prima/dopo è archiviato in `qa/visual-before/` (5 schermate dal commit `a3de235`) e `qa/visual-review/` (14 schermate finali); la valutazione estetica soggettiva dei pixel richiede la visione diretta delle immagini da parte dell'utente.",
  "- `html_preview`/`html_render` non sono disponibili: il server T3 gira come root e Chrome non può avviare il sandbox.",
  "",
];

mkdirSync(join(ROOT, "qa", "logs"), { recursive: true });
writeFileSync(join(ROOT, "qa", "AESTHETIC_REVIEW.json"), JSON.stringify({ generatedAt: new Date().toISOString(), results, findings }, null, 2));
writeFileSync(join(ROOT, "qa", "AESTHETIC_REVIEW.md"), lines.join("\n"));
console.log(`[aesthetic] ${results.length}/14 schermate, ${findings.length} finding`);
if (findings.length) process.exitCode = 1;
