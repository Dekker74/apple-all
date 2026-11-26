#!/usr/bin/env node
/**
 * Offcut premium-redesign QA suite.
 *
 * Verifica il worktree locale (o un base URL esplicito) con Playwright Chromium:
 * - 11 route principali x 6 viewport;
 * - console JS, HTTP, immagini, link, overflow e sovrapposizioni;
 * - EN/IT, dark/light, focus, reduced motion, navigazione app;
 * - vincoli di prodotto e metadata dominio.
 *
 * Nessuna modifica a sorgenti, package.json o configurazioni.
 * Uso: node qa/verify.mjs [--base=http://127.0.0.1:3100] [--quick] [--strict]
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FIXTURES = JSON.parse(readFileSync(join(__dirname, "fixtures", "routes.json"), "utf8"));

function parseArgs(argv) {
  const out = {};
  const flags = new Set(["strict", "quick"]);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    if (eq >= 0) {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (flags.has(key) || !next || next.startsWith("--")) out[key] = true;
    else out[key] = argv[++i];
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
const BASE_URL = String(opts.base || process.env.QA_BASE_URL || FIXTURES.baseUrl).replace(/\/$/, "");
const OUT_DIR = resolve(ROOT, String(opts.out || "qa"));
const SCREENSHOT_DIR = join(OUT_DIR, "screenshots");
const EXPECTED_HOST = "apple-all-andrea-grecos-projects.vercel.app";
const QUICK = Boolean(opts.quick);

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [];
  if (process.env.PLAYWRIGHT_MODULE) candidates.push(process.env.PLAYWRIGHT_MODULE);
  for (const name of ["playwright", "playwright-core"]) {
    try {
      candidates.push(require.resolve(name));
    } catch {
      /* optional */
    }
  }
  const npxRoot = join(homedir(), ".npm", "_npx");
  if (existsSync(npxRoot)) {
    for (const dir of readdirSync(npxRoot)) {
      for (const file of ["index.mjs", "index.js"]) {
        candidates.push(join(npxRoot, dir, "node_modules", "playwright", file));
      }
    }
  }
  for (const candidate of candidates) {
    if (!candidate || !existsSync(candidate)) continue;
    try {
      const mod = await import(pathToFileURL(candidate).href);
      if (mod.chromium) return { ...mod, source: candidate };
    } catch {
      /* try next candidate */
    }
  }
  throw new Error(
    "Playwright non trovato. Installa @playwright/test nel progetto oppure esegui `npx playwright install chromium` e imposta PLAYWRIGHT_MODULE.",
  );
}

function nowIso() {
  return new Date().toISOString();
}

const results = {
  meta: {
    generatedAt: nowIso(),
    baseUrl: BASE_URL,
    expectedHost: EXPECTED_HOST,
    node: process.version,
    mode: QUICK ? "quick" : "full",
    playwright: null,
  },
  coverage: [],
  checks: [],
  findings: [],
  artifacts: [],
  limits: [],
};

function addFinding(finding) {
  const key =
    finding.dedupeKey ||
    [finding.severity, finding.category, finding.route || "-", finding.viewport || "-", finding.message].join("|");
  if (results.findings.some((f) => f.key === key)) return;
  results.findings.push({ key, at: nowIso(), ...finding });
}

function addCheck(name, status, detail) {
  results.checks.push({ name, status, detail });
}

function short(text, max = 180) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function esc(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderReport() {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of results.findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const sorted = [...results.findings].sort((a, b) => order[a.severity] - order[b.severity]);

  const lines = [];
  lines.push("# Offcut — Report QA premium redesign");
  lines.push("");
  lines.push(`- Generato: ${results.meta.generatedAt}`);
  lines.push(`- Base URL: ${results.meta.baseUrl}`);
  lines.push(`- Browser: Playwright Chromium (${results.meta.playwright || "non disponibile"})`);
  lines.push(`- Modalità: ${results.meta.mode}`);
  lines.push(`- Dominio atteso: ${results.meta.expectedHost}`);
  lines.push("");
  lines.push("## Sintesi");
  lines.push("");
  lines.push("| Severità | Finding |");
  lines.push("| --- | ---: |");
  for (const level of ["critical", "high", "medium", "low", "info"]) {
    lines.push(`| ${level} | ${counts[level] || 0} |`);
  }
  lines.push("");
  lines.push(`Route validate: ${results.coverage.length} combinazioni route × viewport.`);
  lines.push("");

  lines.push("## Copertura");
  lines.push("");
  lines.push("| Route | Viewport | HTTP | H1 | Overflow px | Console err | HTTP err | Immagini rotte | EN residue |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const c of results.coverage) {
    lines.push(
      `| ${esc(c.route)} | ${esc(c.viewport)} | ${c.status} | ${c.h1} | ${c.overflowPx} | ${c.consoleErrors} | ${c.httpErrors} | ${c.brokenImages} | ${c.residue} |`,
    );
  }
  lines.push("");

  lines.push("## Verifiche mirate");
  lines.push("");
  lines.push("| Check | Esito | Dettaglio |");
  lines.push("| --- | --- | --- |");
  for (const c of results.checks) {
    lines.push(`| ${esc(c.name)} | ${esc(c.status)} | ${esc(short(c.detail, 260))} |`);
  }
  lines.push("");

  lines.push("## Finding concreti");
  lines.push("");
  if (!sorted.length) {
    lines.push("Nessun finding rilevato.");
  } else {
    for (const f of sorted) {
      lines.push(`### [${f.severity.toUpperCase()}] ${f.category} — ${f.route || "globale"}${f.viewport ? ` @ ${f.viewport}` : ""}`);
      lines.push("");
      lines.push(f.message);
      if (f.evidence) lines.push(`- Evidenza: ${short(f.evidence, 700)}`);
      if (f.source) lines.push(`- Sorgente: ${f.source}`);
      lines.push("");
    }
  }

  lines.push("## Artefatti");
  lines.push("");
  for (const a of results.artifacts) lines.push(`- ${a}`);
  if (!results.artifacts.length) lines.push("- Nessuno screenshot generato.");
  lines.push("");

  lines.push("## Limiti e non eseguiti");
  lines.push("");
  for (const l of results.limits) lines.push(`- ${l}`);
  lines.push("");
  lines.push("## Riesecuzione");
  lines.push("");
  lines.push("```bash");
  lines.push("npm ci");
  lines.push("npx playwright install chromium");
  lines.push("npm run dev -- --port 3100");
  lines.push("node qa/verify.mjs --base=http://127.0.0.1:3100");
  lines.push("npm run typecheck && npm run build");
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

/* ---------- page helpers ---------- */

const PAGE_EVAL = ({ residueWords }) => {
  const visible = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0.05;
  };
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).map((c) => `.${c}`).join("") : "";
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls}`;
  };
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
  };
  const intersection = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? Math.round(w * h) : 0;
  };
  const first = (sel) => {
    const el = document.querySelector(sel);
    return el && visible(el) ? el : null;
  };
  const inScrollable = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const s = getComputedStyle(p);
      if ((s.overflowX === "auto" || s.overflowX === "scroll") && p.scrollWidth > p.clientWidth + 1) return true;
      p = p.parentElement;
    }
    return false;
  };

  const overlapPairs = [
    ["header#top nav#nav-links", "header#top .ctrl-group"],
    [".offcut-app-links", ".offcut-app-tools"],
  ]
    .map(([a, b]) => {
      const ea = first(a);
      const eb = first(b);
      if (!ea || !eb) return null;
      const area = intersection(rectOf(ea), rectOf(eb));
      return area > 0 ? { a, b, area, aRect: rectOf(ea), bRect: rectOf(eb) } : null;
    })
    .filter(Boolean);

  const navSelectors = ["#nav-links", ".offcut-app-links"];
  const navData = navSelectors
    .map((sel) => {
      const nav = first(sel);
      if (!nav) return null;
      const links = [...nav.querySelectorAll("a[href]")].filter(visible);
      const reachable = links.map((a) => {
        const r = rectOf(a);
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return { href: a.getAttribute("href"), skipped: true };
        // Horizontal app bars intentionally clip off-screen links; they are
        // reachable by scrolling, so only hit-test links inside the scroller.
        let scroller = a.parentElement;
        while (scroller && scroller !== document.body) {
          const s = getComputedStyle(scroller);
          if ((s.overflowX === "auto" || s.overflowX === "scroll") && scroller.scrollWidth > scroller.clientWidth + 1) break;
          scroller = scroller.parentElement;
        }
        if (scroller && scroller !== document.body) {
          const sr = rectOf(scroller);
          if (cx < sr.left || cx > sr.right || cy < sr.top || cy > sr.bottom) {
            return { href: a.getAttribute("href"), skipped: true };
          }
        }
        const hit = document.elementFromPoint(cx, cy);
        return {
          href: a.getAttribute("href"),
          hit: !!hit && (hit === a || a.contains(hit) || (hit.closest && hit.closest("a") === a)),
        };
      });
      return { selector: sel, count: links.length, unreachable: reachable.filter((x) => !x.skipped && !x.hit).map((x) => x.href) };
    })
    .filter(Boolean);

  const activePills = [...document.querySelectorAll("nav a.on, .offcut-app-links a.on, .city-pills button.on, .lang-buttons button.on")]
    .filter(visible)
    .map((el) => ({ text: (el.innerText || "").trim(), href: el.getAttribute("href"), rect: rectOf(el) }));

  const appActive = activePills.filter((p) => p.href && p.href.startsWith("/app/"));
  const publicActive = activePills.filter((p) => p.href && !p.href.startsWith("/app/"));

  const overflowOffenders = [...document.querySelectorAll("body *")]
    .filter(visible)
    .filter((el) => !inScrollable(el))
    .map((el) => ({ sel: describe(el), rect: rectOf(el) }))
    .filter((o) => o.rect.right > innerWidth + 2 || o.rect.left < -2)
    .sort((a, b) => b.rect.right - a.rect.right)
    .slice(0, 8);

  const images = [...document.images]
    .filter((img) => img.getAttribute("src"))
    .map((img) => ({ src: shortSrc(img.currentSrc || img.src), ok: img.complete && img.naturalWidth > 0 }));
  function shortSrc(src) {
    return String(src).slice(0, 160);
  }

  const anchors = [...document.querySelectorAll("a[href]")].filter(visible).map((a) => a.getAttribute("href"));
  const deadAnchors = anchors.filter((href) => !href || href === "#" || href.startsWith("javascript:"));
  const externalHosts = [...new Set(
    anchors
      .filter((href) => /^https?:\/\//i.test(href || ""))
      .map((href) => {
        try {
          return new URL(href).host;
        } catch {
          return "invalid";
        }
      }),
  )];

  const unlabelledButtons = [...document.querySelectorAll("button")]
    .filter(visible)
    .map((b) => ({
      sel: describe(b),
      label: (b.innerText || "").trim() || b.getAttribute("aria-label") || b.getAttribute("title") || "",
    }))
    .filter((b) => !b.label)
    .slice(0, 8);

  const text = document.body.innerText || "";
  const escaped = residueWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const rx = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const residueMatches = [...text.matchAll(rx)];
  const residue = [...new Set(residueMatches.map((m) => m[0].toLowerCase()))];
  const residueSamples = residueMatches.slice(0, 8).map((m) => {
    const start = Math.max(0, m.index - 36);
    return text.slice(start, m.index + m[0].length + 36).replace(/\s+/g, " ").trim();
  });

  const parseColor = (value) => {
    const match = /rgba?\(([^)]+)\)/.exec(value || "");
    if (!match) return null;
    const parts = match[1].split(",").map((v) => Number.parseFloat(v));
    if (parts.length < 3 || parts.some((v) => Number.isNaN(v))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const bgOf = (el) => {
    const layers = [];
    let p = el;
    while (p && p.nodeType === 1) {
      const c = parseColor(getComputedStyle(p).backgroundColor);
      if (c && c.a > 0) layers.push(c);
      p = p.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i -= 1) base = over(layers[i], base);
    return base;
  };
  const lum = (c) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const contrastIssues = [];
  const textEls = [...document.querySelectorAll("h1,h2,h3,h4,p,a,button,label,span,td,th,li,strong,small")]
    .filter(visible)
    .filter((el) => (el.innerText || "").trim().length > 1)
    .slice(0, 220);
  for (const el of textEls) {
    const s = getComputedStyle(el);
    const fg = parseColor(s.color);
    if (!fg) continue;
    const bg = bgOf(el);
    const size = Number.parseFloat(s.fontSize) || 14;
    const weight = Number.parseInt(s.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const r = ratio(over(fg, bg), bg);
    const min = large ? 3 : 4.5;
    if (r < min - 0.15) {
      contrastIssues.push({
        sel: describe(el),
        ratio: Math.round(r * 100) / 100,
        min,
        color: s.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        text: (el.innerText || "").trim().slice(0, 70),
      });
    }
  }

  return {
    title: document.title,
    lang: document.documentElement.lang,
    theme: document.documentElement.getAttribute("data-theme"),
    statusH1: document.querySelectorAll("h1").length,
    h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()).slice(0, 2),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    overflowOffenders,
    overlapPairs,
    navData,
    activePills: { app: appActive, public: publicActive },
    images,
    deadAnchors,
    externalHosts,
    unlabelledButtons,
    residue,
    residueSamples,
    contrastIssues: contrastIssues.slice(0, 8),
    bodyLength: text.length,
    hasMain: !!document.querySelector("main"),
    hasHeader: !!document.querySelector("header, .offcut-app-bar"),
    hasFooter: !!document.querySelector("footer"),
  };
};

async function goto(page, path) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  // Trigger native lazy loading without mutating DOM attributes (which would
  // cause a React hydration mismatch), then restore the viewport to the top.
  await page.evaluate(async () => {
    for (const img of [...document.images].filter((image) => image.loading === "lazy")) {
      img.scrollIntoView({ block: "center", inline: "nearest" });
      if (!img.complete) {
        await Promise.race([
          new Promise((done) => {
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
          new Promise((done) => setTimeout(done, 350)),
        ]);
      }
    }
    window.scrollTo(0, 0);
  });
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        [...document.images]
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((done) => {
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
              }),
          ),
      ),
      new Promise((done) => setTimeout(done, 1800)),
    ]),
  );
  return response?.status() || 0;
}

/** Open the demo workspace so app-route checks see the real authenticated shell. */
async function signInDemo(page) {
  await goto(page, "/login");
  const demo = page.locator('button[aria-label*="buyer"], button[aria-label*="acquirente"]').first();
  await demo.waitFor({ state: "visible", timeout: 15000 });
  await demo.click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 15000 }).catch(() => {});
  await page.waitForSelector(".offcut-app-links a", { timeout: 15000 });
}

async function clickContinue(page) {
  await page.getByRole("button", { name: /^(Continua|Continue)$/ }).click();
  await page.waitForTimeout(120);
}

/** Seed language/theme once per browser context so reloads preserve user choices. */
async function seedPrefs(context, { lang, theme } = {}) {
  await context.addInitScript(({ lang: nextLang, theme: nextTheme }) => {
    try {
      if (sessionStorage.getItem("__qa_prefs_seeded")) return;
      if (nextLang) localStorage.setItem("circularlink.lang", nextLang);
      if (nextTheme) localStorage.setItem("circularlink-theme", nextTheme);
      sessionStorage.setItem("__qa_prefs_seeded", "1");
    } catch {
      /* ignore */
    }
  }, { lang, theme });
}

/* ---------- checks ---------- */

async function checkRoute(browser, route, viewport, residueWords) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "light",
    reducedMotion: "no-preference",
    deviceScaleFactor: 1,
  });
  await seedPrefs(context, { lang: "en", theme: "light" });
  const page = await context.newPage();
  const consoleErrors = [];
  const httpErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "failed";
    // Next.js prefetches/RSC streams are legitimately cancelled during navigation.
    if (errorText === "net::ERR_ABORTED") return;
    failedRequests.push(`${errorText} ${request.url()}`);
  });

  let status = 0;
  try {
    if (route.group === "app") await signInDemo(page);
    status = await goto(page, route.path);
    await page.waitForTimeout(180);
    const data = await page.evaluate(PAGE_EVAL, { residueWords });
    const overflowPx = Math.max(0, data.scrollWidth - data.innerWidth);

    results.coverage.push({
      route: route.path,
      viewport: viewport.name,
      status,
      h1: data.statusH1,
      overflowPx,
      consoleErrors: consoleErrors.length,
      httpErrors: httpErrors.length,
      brokenImages: data.images.filter((i) => !i.ok).length,
      residue: data.residue.length,
    });

    const push = (severity, category, message, evidence, extra = {}) =>
      addFinding({ severity, category, route: route.path, viewport: viewport.name, message, evidence, ...extra });

    if (consoleErrors.length) push("high", "console JS", `${consoleErrors.length} errori console/JS.`, consoleErrors.slice(0, 4).join(" | "));
    if (httpErrors.length) push("high", "HTTP", `${httpErrors.length} risposte HTTP >= 400.`, httpErrors.slice(0, 6).join(" | "));
    if (failedRequests.length) push("medium", "rete", `${failedRequests.length} richieste fallite.`, failedRequests.slice(0, 5).join(" | "));
    const broken = data.images.filter((i) => !i.ok);
    if (broken.length) push("high", "immagini", `${broken.length} immagini mancanti o non decodificate.`, broken.slice(0, 5).map((i) => i.src).join(" | "));
    if (overflowPx > 2) {
      push("high", "overflow orizzontale", `document.scrollWidth supera il viewport di ${overflowPx}px.`, data.overflowOffenders.map((o) => `${o.sel} right=${o.rect.right}`).join(" | "));
    }
    for (const pair of data.overlapPairs) {
      push("critical", "sovrapposizione menu", `Sovrapposizione ${pair.a} / ${pair.b}: area ${pair.area}px².`, JSON.stringify(pair), {
        dedupeKey: `overlap|${route.path}|${pair.a}|${pair.b}`,
      });
    }
    for (const nav of data.navData) {
      if (nav.unreachable.length) {
        push("high", "link navigazione", `${nav.unreachable.length} link in ${nav.selector} non raggiungibili con hit-test.`, nav.unreachable.join(" | "));
      }
    }
    if (route.group === "app" && !data.activePills.app.length) {
      push("medium", "active pill", "Nessuna pill attiva nella app bar.", "Nessun `.offcut-app-links a.on` visibile.");
    }
    if (data.deadAnchors.length) push("medium", "link rotti", `${data.deadAnchors.length} anchor con href vuoto/#/javascript.`, data.deadAnchors.join(" | "));
    if (data.unlabelledButtons.length) {
      push("medium", "pulsanti senza nome", `${data.unlabelledButtons.length} pulsanti senza testo o aria-label.`, JSON.stringify(data.unlabelledButtons));
    }
    if (!data.hasMain) push("medium", "struttura", "Landmark <main> assente.");
    if (route.group !== "negative" && !data.statusH1) push("low", "struttura", "Nessun H1 presente nella pagina.");
    if (data.residue.length) {
      push("medium", "EN/IT", `${data.residue.length} parole italiane residue con lingua EN attiva.`, data.residueSamples.join(" | "), {
        dedupeKey: `residue|${route.path}|${data.residue.join(",")}`,
      });
    }
    if (data.contrastIssues.length) {
      push("medium", "contrasto", `${data.contrastIssues.length} coppie testo/sfondo sotto la soglia WCAG AA stimata.`, JSON.stringify(data.contrastIssues.slice(0, 5)), {
        dedupeKey: `contrast|${route.path}|${data.contrastIssues.map((i) => i.sel).join(",")}`,
      });
    }
    if (data.externalHosts.some((h) => !h.endsWith(".vercel.app"))) {
      push("info", "dominio", "Link esterni non vercel.app presenti nella pagina.", data.externalHosts.join(" | "), {
        dedupeKey: `domain|external|${data.externalHosts.join(",")}`,
      });
    }
  } catch (err) {
    addFinding({
      severity: "critical",
      category: "esecuzione",
      route: route.path,
      viewport: viewport.name,
      message: "Route non caricata.",
      evidence: err.message,
    });
  } finally {
    await context.close().catch(() => {});
  }
}

async function checkInternalLinks(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const seen = new Set();
  const broken = [];
  for (const route of [...FIXTURES.routes, ...FIXTURES.focusRoutes]) {
    if (route.group === "negative") continue;
    try {
      await goto(page, route.path);
      const hrefs = await page.$$eval("a[href]", (anchors) => anchors.map((a) => a.getAttribute("href")).filter(Boolean));
      for (const href of hrefs) {
        if (!href.startsWith("/") || href.startsWith("//")) continue;
        const path = href.split("#")[0].split("?")[0];
        if (!path || seen.has(path)) continue;
        seen.add(path);
        const response = await page.request.get(`${BASE_URL}${path}`, { maxRedirects: 5, timeout: 20000 });
        if (response.status() >= 400) broken.push(`${href} -> ${response.status()}`);
      }
    } catch (err) {
      broken.push(`${route.path} -> ${err.message}`);
    }
  }
  addCheck("Link interni", broken.length ? "FAIL" : "PASS", `${seen.size} URL interni unici verificati; ${broken.length} rotti.`);
  if (broken.length) {
    addFinding({
      severity: "high",
      category: "link rotti",
      message: `${broken.length} link interni non risolvono.`,
      evidence: broken.slice(0, 10).join(" | "),
      dedupeKey: "internal-links",
    });
  }
  await context.close().catch(() => {});
}

async function checkThemeAndLanguage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await seedPrefs(context, { lang: "it", theme: "light" });
  const page = await context.newPage();
  await goto(page, "/");

  const before = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    lang: document.documentElement.lang,
    text: document.body.innerText.slice(0, 400),
  }));
  await page.click("#theme-toggle");
  await page.waitForTimeout(150);
  const toggled = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    darkClass: document.documentElement.classList.contains("dark"),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-theme"), null, { timeout: 10000 }).catch(() => {});
  const persisted = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const themeOk = before.theme === "light" && toggled.theme === "dark" && toggled.darkClass && persisted === "dark";
  addCheck("Dark/light + persistenza", themeOk ? "PASS" : "FAIL", `iniziale=${before.theme}, dopo toggle=${toggled.theme}, dopo reload=${persisted}, bodyBg=${toggled.bodyBg}`);
  if (!themeOk) {
    addFinding({
      severity: "high",
      category: "tema",
      route: "/",
      message: "Toggle dark/light non coerente o preferenza non persistita.",
      evidence: `iniziale=${before.theme}, toggle=${toggled.theme}, reload=${persisted}`,
      dedupeKey: "theme-toggle",
    });
  }

  await page.waitForFunction(
    () => document.documentElement.lang === "it" && document.body.innerText.includes("Chi siamo"),
    null,
    { timeout: 10000 },
  ).catch(() => {});
  const itText = await page.evaluate(() => document.body.innerText.slice(0, 400));
  await page.locator('.lang-buttons button').filter({ hasText: /^EN$/ }).click();
  await page.waitForFunction(
    () => document.documentElement.lang === "en" && document.body.innerText.includes("Who we are"),
    null,
    { timeout: 10000 },
  ).catch(() => {});
  const en = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    pressed: [...document.querySelectorAll('.lang-buttons button')].find((b) => b.textContent.trim() === "EN")?.getAttribute("aria-pressed"),
    text: document.body.innerText.slice(0, 400),
  }));
  const langOk = en.lang === "en" && en.pressed === "true" && en.text !== itText;
  addCheck("Toggle EN/IT", langOk ? "PASS" : "FAIL", `lang=${en.lang}, aria-pressed=${en.pressed}, testo cambiato=${en.text !== itText}`);
  if (!langOk) {
    addFinding({
      severity: "high",
      category: "EN/IT",
      route: "/",
      message: "Toggle lingua non aggiorna lang/aria-pressed/testo.",
      evidence: JSON.stringify(en),
      dedupeKey: "language-toggle",
    });
  }
  await context.close().catch(() => {});
}

async function checkAppNav(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await seedPrefs(context, { lang: "it", theme: "light" });
  const page = await context.newPage();
  await signInDemo(page);
  const failures = [];
  const appRoutes = FIXTURES.routes.filter((r) => r.group === "app");
  for (const route of appRoutes) {
    await goto(page, route.path);
    const before = await page.$$eval(".offcut-app-links a[href]", (links) => links.map((a) => a.getAttribute("href")));
    if (before.length < 8) failures.push(`${route.path}: ${before.length} link app bar`);
    try {
      await page.click(`.offcut-app-links a[href="${route.path}"]`);
      await page.waitForTimeout(180);
      const active = await page.$$eval(".offcut-app-links a.on", (links) => links.map((a) => ({ text: a.innerText.trim(), href: a.getAttribute("href") })));
      if (active.length !== 1 || active[0].href !== route.path) {
        failures.push(`${route.path}: active=${JSON.stringify(active)}`);
      }
    } catch (err) {
      failures.push(`${route.path}: click fallito (${err.message})`);
    }
  }
  await context.close().catch(() => {});

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedPrefs(mobile, { lang: "it" });
  const mpage = await mobile.newPage();
  await signInDemo(mpage);
  await goto(mpage, "/app/dashboard");
  const mobileInfo = await mpage.evaluate(() => {
    const nav = document.querySelector(".offcut-app-links");
    const active = document.querySelector(".offcut-app-links a.on");
    if (!nav || !active) return { ok: false };
    const n = nav.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    return {
      ok: a.left >= n.left - 1 && a.right <= n.right + 1,
      nav: { left: Math.round(n.left), right: Math.round(n.right), scrollLeft: nav.scrollLeft, scrollWidth: nav.scrollWidth, clientWidth: nav.clientWidth },
      active: { text: active.innerText.trim(), left: Math.round(a.left), right: Math.round(a.right) },
    };
  });
  const mobileHrefs = await mpage.$$eval(".offcut-app-links a[href]", (links) => links.map((a) => a.getAttribute("href")));
  for (const href of mobileHrefs) {
    const link = mpage.locator(`.offcut-app-links a[href="${href}"]`);
    await link.scrollIntoViewIfNeeded();
    const reachable = await link.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && (hit === el || el.contains(hit) || hit.closest("a") === el);
    });
    if (!reachable) failures.push(`mobile ${href}: non cliccabile dopo scroll`);
  }
  addCheck(
    "App bar link + pill attiva",
    failures.length || !mobileInfo.ok ? "FAIL" : "PASS",
    `${appRoutes.length} route app; mobile active pill visibile=${mobileInfo.ok}; ${mobileInfo.active?.text || "-"}`,
  );
  if (failures.length) {
    addFinding({
      severity: "high",
      category: "navigazione app",
      message: `${failures.length} anomalie nella navigazione app bar.`,
      evidence: failures.slice(0, 8).join(" | "),
      dedupeKey: "app-nav",
    });
  }
  if (!mobileInfo.ok) {
    addFinding({
      severity: "medium",
      category: "active pill mobile",
      route: "/app/dashboard",
      viewport: "mobile-390",
      message: "Pill attiva non visibile nel run orizzontale della app bar.",
      evidence: JSON.stringify(mobileInfo),
      dedupeKey: "app-nav-mobile-active",
    });
  }
  await mobile.close().catch(() => {});
}

async function checkFocus(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await goto(page, "/");
  const stops = [];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el.tagName === "NEXTJS-PORTAL") return null;
      const s = getComputedStyle(el);
      const skip = el.tagName === "A" && el.getAttribute("href") === "#main";
      const hasFocus =
        (s.outlineStyle && s.outlineStyle !== "none" && Number.parseFloat(s.outlineWidth || "0") > 0) ||
        (s.boxShadow && s.boxShadow !== "none");
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 50),
        focusVisible: hasFocus,
        skip,
      };
    });
    if (info) stops.push(info);
  }
  const noFocus = stops.filter((s) => !s.skip && !s.focusVisible);
  const skipWorks = stops.some((s) => s.skip && s.focusVisible);
  addCheck("Focus visibile da tastiera", noFocus.length ? "FAIL" : "PASS", `${stops.length} tab stop, ${noFocus.length} senza indicatore; skip-link=${skipWorks}`);
  if (noFocus.length) {
    addFinding({
      severity: "medium",
      category: "accessibilità",
      route: "/",
      message: `${noFocus.length} tab stop senza outline/box-shadow visibile.`,
      evidence: JSON.stringify(noFocus),
      dedupeKey: "focus-visible",
    });
  }
  await context.close().catch(() => {});
}

async function checkReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await goto(page, "/");
  const data = await page.evaluate(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animated = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
      })
      .map((el) => {
        const s = getComputedStyle(el);
        return {
          sel: `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? `.${el.className.split(/\s+/)[0]}` : ""}`,
          animation: s.animationName,
          animationDuration: s.animationDuration,
          transitionDuration: s.transitionDuration,
        };
      })
      .filter((x) => (x.animation !== "none" && Number.parseFloat(x.animationDuration) > 0.01) || Number.parseFloat(x.transitionDuration) > 0.01)
      .slice(0, 12);
    return { query, animated };
  });
  addCheck(
    "prefers-reduced-motion",
    !data.query || data.animated.length ? "FAIL" : "PASS",
    `media query=${data.query}; elementi con animazione/transizione attiva=${data.animated.length}`,
  );
  if (data.animated.length) {
    addFinding({
      severity: "medium",
      category: "reduced motion",
      route: "/",
      message: `${data.animated.length}+ elementi mantengono animazioni/transizioni con prefers-reduced-motion: reduce.`,
      evidence: JSON.stringify(data.animated.slice(0, 6)),
      dedupeKey: "reduced-motion",
    });
  }
  await context.close().catch(() => {});
}

async function checkChatbotMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await goto(page, "/");
  const readPanel = () => page.evaluate(() => {
    const panel = document.querySelector("#chat-panel");
    const header = document.querySelector("header#top");
    const nav = document.querySelector("#nav-links");
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) };
    };
    const inter = (a, b) => (!a || !b ? 0 : Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)));
    const p = box(panel);
    return {
      open: !!panel && panel.classList.contains("open"),
      panel: p,
      headerOverlap: Math.round(inter(p, box(header))),
      navOverlap: Math.round(inter(p, box(nav))),
    };
  });
  const initial = await readPanel();
  if (initial.open) {
    await page.click("#chat-close").catch(() => {});
    await page.waitForTimeout(150);
  }
  await page.click("#chat-toggle").catch(() => {});
  await page.waitForTimeout(150);
  const opened = await readPanel();
  await page.click("#chat-close").catch(() => {});
  await page.waitForTimeout(150);
  const closed = await readPanel();
  await page.click("#chat-toggle").catch(() => {});
  await page.waitForTimeout(150);
  const reopened = await readPanel();
  const openWorks = opened.open;
  const closeWorks = !opened.open || !closed.open;
  const reopenWorks = reopened.open;
  addCheck(
    "Chatbot mobile",
    openWorks && closeWorks && reopenWorks ? "PASS" : "FAIL",
    `apertura iniziale=${initial.open}, apertura manuale=${openWorks}, chiusura=${closeWorks}, riapertura=${reopenWorks}, overlap header=${opened.headerOverlap}px², nav=${opened.navOverlap}px²`,
  );
  if (opened.headerOverlap > 0 || opened.navOverlap > 0) {
    addFinding({
      severity: "medium",
      category: "chatbot",
      route: "/",
      viewport: "mobile-390",
      message: "Pannello chatbot copre header/nav su smartphone.",
      evidence: JSON.stringify(opened),
      dedupeKey: "chat-mobile-overlap",
    });
  }
  if (!openWorks || !closeWorks || !reopenWorks) {
    addFinding({
      severity: "medium",
      category: "chatbot",
      route: "/",
      viewport: "mobile-390",
      message: "Pulsanti chiudi/apri chat non funzionanti.",
      evidence: `open=${openWorks}, close=${closeWorks}, reopen=${reopenWorks}`,
      dedupeKey: "chat-toggle",
    });
  }
  await context.close().catch(() => {});
}

async function checkConstraints(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await seedPrefs(context, { lang: "it" });
  const page = await context.newPage();
  await signInDemo(page);
  const snapshot = async (path) => {
    await goto(page, path);
    return page.evaluate(() => ({
      text: document.body.innerText,
      checkboxes: document.querySelectorAll('[role="checkbox"], input[type="checkbox"]').length,
      fileInputs: document.querySelectorAll('input[type="file"]').length,
      multipleFile: document.querySelectorAll('input[type="file"][multiple]').length,
      dates: document.querySelectorAll('input[type="date"]').length,
      weekly: [...document.querySelectorAll("option")].some((o) => /settimanal|weekly/i.test(o.textContent || "")),
      radios: document.querySelectorAll('input[type="radio"], [role="radio"]').length,
      selects: [...document.querySelectorAll("select")].filter((s) => s.getBoundingClientRect().width > 0).map((s) => Math.round(s.getBoundingClientRect().left)),
      fields: document.querySelectorAll("input:not([type=hidden]), select, textarea").length,
    }));
  };

  const signup = await snapshot("/signup");
  addCheck("Onboarding 2 passi / no scelta buyer-seller", signup.radios === 0 && signup.fields <= 8 ? "PASS" : "FAIL", `campi steps iniziali=${signup.fields}, radio=${signup.radios}`);
  if (signup.radios > 0) {
    addFinding({ severity: "medium", category: "vincoli prodotto", route: "/signup", message: "Registrazione espone scelta di ruolo buyer/seller.", evidence: `radio=${signup.radios}`, dedupeKey: "signup-role-choice" });
  }

  // Seller wizard: conditions are on step 2, the uploader is on step 5.
  await goto(page, "/app/listings/new");
  await page.locator('[role="group"][aria-label*="Categoria"] button').first().click();
  await clickContinue(page);
  const listingInfo = await page.evaluate(() => ({
    text: document.body.innerText,
    conditionButtons: document.querySelectorAll('[role="group"][aria-label*="Condizion"] button[aria-pressed]').length,
  }));
  await page.fill("#listing-title", "Ritagli cartone per QA");
  await page.fill("#listing-description", "Descrizione materiale per verifica del flusso.");
  await page.locator('[role="group"][aria-label*="Condizion"] button').first().click();
  await clickContinue(page);
  await page.fill("#listing-quantity", "1000");
  await page.fill("#listing-min-order", "100");
  await page.fill("#listing-price", "0.5");
  await clickContinue(page);
  await page.locator('input[aria-label*="Componente"], input[aria-label*="Component"]').first().fill("OCC");
  await page.fill("#listing-packaging", "Balle");
  await clickContinue(page);
  const listingPhotos = await page.evaluate(() => ({
    text: document.body.innerText,
    fileInputs: document.querySelectorAll('input[type="file"]').length,
    multipleFile: document.querySelectorAll('input[type="file"][multiple]').length,
  }));
  const listingConditions = /Condizioni/.test(listingInfo.text);
  const listingPhotoLabel = /Foto|photo/i.test(listingPhotos.text);
  const listingOk = listingInfo.conditionButtons >= 3 && listingPhotos.multipleFile >= 1 && listingConditions && listingPhotoLabel;
  addCheck(
    "Condizioni multi-select + upload foto",
    listingOk ? "PASS" : "FAIL",
    `condizioni=${listingInfo.conditionButtons}, file multipli=${listingPhotos.multipleFile}, testi chiave=${listingConditions}/${listingPhotoLabel}`,
  );
  if (!listingOk) {
    addFinding({ severity: "medium", category: "vincoli prodotto", route: "/app/listings/new", message: "Mancano condizioni multi-select o upload foto venditore.", evidence: JSON.stringify({ ...listingInfo, ...listingPhotos }), dedupeKey: "listing-constraints" });
  }

  // Buyer wizard: weekly frequency is on step 2, conditions on step 3, delivery date on step 4.
  await goto(page, "/app/requests/new");
  await page.locator('[role="group"][aria-label*="Categoria"] button').first().click();
  await page.fill("#request-title", "Richiesta cartone QA");
  await page.fill("#request-description", "Richiesta materiale per verifica del flusso.");
  await clickContinue(page);
  const requestStep1 = await page.evaluate(() => ({
    text: document.body.innerText,
    weekly: [...document.querySelectorAll("option")].some((o) => /settimanal|weekly/i.test(o.textContent || "")),
    selects: [...document.querySelectorAll("select")].filter((s) => s.getBoundingClientRect().width > 0).map((s) => Math.round(s.getBoundingClientRect().left)),
  }));
  await page.fill("#request-quantity", "1000");
  await page.fill("#request-budget", "1000");
  await clickContinue(page);
  const composition = page.locator('input[aria-label*="Composizione"], input[aria-label*="composition"]').first();
  await composition.fill("OCC");
  await composition.press("Enter");
  const requestStep2 = await page.evaluate(() => ({
    conditionButtons: document.querySelectorAll('[role="group"][aria-label*="Condizion"] button[aria-pressed]').length,
  }));
  await page.locator('[role="group"][aria-label*="Condizion"] button').first().click();
  await clickContinue(page);
  const requestStep3 = await page.evaluate(() => ({
    text: document.body.innerText,
    dates: document.querySelectorAll('input[type="date"]').length,
    selects: [...document.querySelectorAll("select")].filter((s) => s.getBoundingClientRect().width > 0).map((s) => Math.round(s.getBoundingClientRect().left)),
  }));
  const requestDateLabel = /Data di consegna richiesta/.test(requestStep3.text);
  const requestOk = requestStep1.weekly && requestStep3.dates >= 1 && requestStep2.conditionButtons >= 3 && requestDateLabel;
  addCheck("Ricorrenza settimanale + data consegna", requestOk ? "PASS" : "FAIL", `weekly=${requestStep1.weekly}, date=${requestStep3.dates}, condizioni=${requestStep2.conditionButtons}, etichetta=${requestDateLabel}`);
  if (!requestOk) {
    addFinding({ severity: "medium", category: "vincoli prodotto", route: "/app/requests/new", message: "Mancano ricorrenza settimanale, data consegna o condizioni multi-select.", evidence: JSON.stringify({ ...requestStep1, ...requestStep2, ...requestStep3 }), dedupeKey: "request-constraints" });
  }
  const requestSelects = [...requestStep1.selects, ...requestStep3.selects];
  const spread = requestSelects.length > 1 ? Math.max(...requestSelects) - Math.min(...requestSelects) : 0;
  addCheck("Select allineate", spread <= 48 ? "PASS" : "INFO", `left selettori=${requestSelects.join(",")}, spread=${spread}px`);

  const detail = await snapshot("/app/marketplace/lst_occ");
  const detailOk = /Data di consegna desiderata/.test(detail.text) && /Trasporto/.test(detail.text);
  addCheck("Trasporto ordine e data consegna acquirente", detailOk ? "PASS" : "FAIL", `dettaglio materiale: data=${/Data di consegna desiderata/.test(detail.text)}, trasporto=${/Trasporto/.test(detail.text)}`);
  if (!detailOk) {
    addFinding({ severity: "medium", category: "vincoli prodotto", route: "/app/marketplace/lst_occ", message: "Dettaglio materiale non espone data consegna scelta dall'acquirente o trasporto.", evidence: short(detail.text.slice(0, 300)), dedupeKey: "detail-transport" });
  }

  const settings = await snapshot("/app/settings");
  const bothOk = /Acquirente e fornitore|Buyer and supplier/.test(settings.text);
  addCheck("Buy e sell entrambi attivi", bothOk ? "PASS" : "FAIL", bothOk ? "Modalità acquirente e fornitore presente." : "Modalità non trovata.");
  if (!bothOk) {
    addFinding({ severity: "high", category: "vincoli prodotto", route: "/app/settings", message: "Non risulta la modalità acquirente e fornitore attiva.", dedupeKey: "both-modes" });
  }

  const quote = await snapshot("/preventivo");
  addCheck("Form preventivo breve", quote.fields <= 10 ? "PASS" : "INFO", `${quote.fields} campi nel form.`);
  await context.close().catch(() => {});
}

async function checkMetadata(browser) {
  const context = await browser.newContext();
  const request = context.request;
  const data = {};
  for (const [key, path] of [
    ["home", "/"],
    ["sitemap", "/sitemap.xml"],
    ["robots", "/robots.txt"],
  ]) {
    try {
      const response = await request.get(`${BASE_URL}${path}`, { timeout: 20000 });
      data[key] = { status: response.status(), body: await response.text() };
    } catch (err) {
      data[key] = { status: 0, body: err.message };
    }
  }
  const home = data.home.body;
  const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i.exec(home)?.[1] || "";
  const ogUrl = /<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i.exec(home)?.[1] || "";
  const hreflang = (home.match(/hreflang=/gi) || []).length;
  const sitemapUrls = [...data.sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const wrong = [...sitemapUrls, canonical, ogUrl].filter((u) => u && new URL(u, BASE_URL).host !== EXPECTED_HOST);
  const nonVercel = [...sitemapUrls, canonical, ogUrl].filter((u) => u && !new URL(u, BASE_URL).host.endsWith(".vercel.app"));
  const appIndexed = /(^|\n)\s*Allow:\s*\/app/i.test(data.robots.body);
  addCheck(
    "Metadata dominio",
    wrong.length || nonVercel.length || appIndexed || hreflang < 2 ? "FAIL" : "PASS",
    `canonical=${canonical}, og:url=${ogUrl}, hreflang=${hreflang}, sitemap=${sitemapUrls.length} URL, app indicizzato=${appIndexed}`,
  );
  if (wrong.length) {
    addFinding({
      severity: "high",
      category: "dominio",
      message: `${wrong.length} URL canonical/sitemap non usano il dominio atteso ${EXPECTED_HOST}.`,
      evidence: wrong.join(" | "),
      dedupeKey: "domain-wrong-host",
    });
  }
  if (nonVercel.length) {
    addFinding({
      severity: "high",
      category: "dominio",
      message: `${nonVercel.length} URL fuori dal dominio vercel.app.`,
      evidence: nonVercel.join(" | "),
      dedupeKey: "domain-non-vercel",
    });
  }
  if (appIndexed) {
    addFinding({ severity: "medium", category: "SEO", message: "robots.txt consente l'indicizzazione di /app.", evidence: data.robots.body.slice(0, 300), dedupeKey: "robots-app" });
  }
  if (hreflang < 2) {
    addFinding({ severity: "low", category: "SEO", message: `Solo ${hreflang} annotazioni hreflang rilevate.`, dedupeKey: "hreflang" });
  }
  await context.close().catch(() => {});
}

async function captureScreenshots(browser) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const shots = [
    { name: "home-390-en-light.png", path: "/", width: 390, height: 844, lang: "en", theme: "light" },
    { name: "home-1440-it-dark.png", path: "/", width: 1440, height: 900, lang: "it", theme: "dark" },
    { name: "dashboard-390-it-light.png", path: "/app/dashboard", width: 390, height: 844, lang: "it", theme: "light" },
    { name: "marketplace-1440-en-light.png", path: "/app/marketplace", width: 1440, height: 900, lang: "en", theme: "light" },
  ];
  for (const shot of shots) {
    const context = await browser.newContext({ viewport: { width: shot.width, height: shot.height } });
    await seedPrefs(context, { lang: shot.lang, theme: shot.theme });
    const page = await context.newPage();
    try {
      if (shot.path.startsWith("/app/")) await signInDemo(page);
      await goto(page, shot.path);
      const file = join(SCREENSHOT_DIR, shot.name);
      await page.screenshot({ path: file });
      results.artifacts.push(`qa/screenshots/${shot.name}`);
    } catch {
      /* artefatto opzionale */
    }
    await context.close().catch(() => {});
  }
}

/* ---------- main ---------- */

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const pw = await loadPlaywright();
  results.meta.playwright = pw.source;
  const browser = await pw.chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const viewports = QUICK ? FIXTURES.viewports.filter((v) => ["mobile-390", "desktop-1440"].includes(v.name)) : FIXTURES.viewports;
  const words = FIXTURES.italianResidue;

  for (const viewport of viewports) {
    for (const route of FIXTURES.routes) {
      await checkRoute(browser, route, viewport, words);
    }
  }

  await checkInternalLinks(browser);
  await checkThemeAndLanguage(browser);
  await checkAppNav(browser);
  await checkFocus(browser);
  await checkReducedMotion(browser);
  await checkChatbotMobile(browser);
  await checkConstraints(browser);
  await checkMetadata(browser);
  await captureScreenshots(browser);
  await browser.close().catch(() => {});

  results.limits.push("Verifica eseguita sul worktree locale, non sulla preview Vercel (SSO non richiesto).");
  results.limits.push("Contrasto calcolato dai colori CSS compositi: non sostituisce un audit WCAG con screen reader.");
  results.limits.push("Download preventivo e pagamento non eseguiti: flusso richiede creazione ordine; nessuna azione irreversibile avviata.");
  results.limits.push("Lighthouse non eseguito: fuori dal perimetro dello script QA proporzionato; usare browser tool lighthouse separatamente.");

  writeFileSync(join(OUT_DIR, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, "QA_REPORT.md"), `${renderReport()}\n`);

  const severe = results.findings.filter((f) => ["critical", "high"].includes(f.severity)).length;
  console.log(`[qa] ${results.coverage.length} route/viewport, ${results.findings.length} finding (${severe} critical/high).`);
  console.log(`[qa] report: ${join(OUT_DIR, "QA_REPORT.md")}`);
  if (opts.strict && severe) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[qa] errore fatale:", err);
  process.exitCode = 2;
});
