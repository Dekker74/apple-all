import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
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
const context = await browser.newContext();
const headers = {
  "content-type": "application/json",
  "x-forwarded-for": `qa-targeted-${Date.now()}.203.0.113`,
};

const oversized = await context.request.post(`${BASE}/api/chat`, {
  headers,
  data: { message: "x".repeat(11_000) },
  timeout: 15000,
});
assert.equal(oversized.status(), 413, `oversized=${oversized.status()}`);
console.log(`[chat-api] PASS payload oltre 10 KB → 413`);

const invalid = await context.request.post(`${BASE}/api/chat`, {
  headers,
  data: { message: "" },
  timeout: 15000,
});
assert.equal(invalid.status(), 400, `invalid=${invalid.status()}`);
console.log("[chat-api] PASS messaggio vuoto → 400");

for (let i = 0; i < 18; i += 1) {
  const answer = await context.request.post(`${BASE}/api/chat`, {
    headers,
    data: { message: "" },
    timeout: 15000,
  });
  assert.equal(answer.status(), 400, `richiesta ${i + 2} status=${answer.status()}`);
}
console.log("[chat-api] PASS 20 richieste accettate nella finestra");

const limited = await context.request.post(`${BASE}/api/chat`, {
  headers,
  data: { message: "" },
  timeout: 15000,
});
assert.equal(limited.status(), 429, `limited=${limited.status()}`);
assert.ok(Number(limited.headers()["retry-after"]) >= 1);
console.log("[chat-api] PASS 21ª richiesta → 429 con Retry-After");

await browser.close();
console.log("[chat-api] 4 verifiche PASS");
