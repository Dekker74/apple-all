# QA suite — Offcut premium redesign

Questa cartella contiene la suite di verifica proporzionata preparata per il redesign premium di Offcut. La suite è **read-only** rispetto all'applicazione: non modifica `src/**`, `public/**`, `package.json` o configurazioni e non esegue deploy, push o PR.

## File

- `verify.mjs`: script Playwright principale. Esegue la matrice route × viewport e le verifiche mirate.
- `fixtures/routes.json`: route principali, viewport, route di approfondimento e lessico per rilevare italiano residuo in EN.
- `QA_REPORT.md`: report leggibile generato dall'ultima esecuzione.
- `results.json`: risultati strutturati (copertura, check, finding).
- `screenshots/`: evidenze visive generate automaticamente (4 scatti).

## Prerequisiti

```bash
npm ci
npx playwright install chromium
npm run dev -- --port 3100
```

Playwright non è una dipendenza dichiarata nel progetto: lo script lo risolve nell'ordine da `PLAYWRIGHT_MODULE`, `node_modules`, cache `npx` e installazione globale. Non viene aggiunto alcun pacchetto a `package.json`.

## Esecuzione

```bash
node qa/verify.mjs
node qa/verify.mjs --base=https://apple-all.vercel.app
node qa/verify.mjs --quick
node qa/verify.mjs --strict
```

- `--base`: URL da verificare (default `http://127.0.0.1:3100`).
- `--quick`: solo viewport 390 e 1440.
- `--strict`: exit code 1 se esistono finding `critical` o `high`.
- `--out`: cartella di output (default `qa/`).

Lo script scrive sempre `qa/results.json` e `qa/QA_REPORT.md`, anche quando rileva difetti.

## Cosa verifica

1. Homepage + 10 route principali su 390, 430, 768, 1024, 1440 e 1920 px.
2. Console JavaScript, `pageerror`, HTTP >= 400, richieste fallite, immagini mancanti.
3. Overflow orizzontale, sovrapposizione tra menu/controlli, hit-test dei link di navigazione.
4. Active pill nella app bar (desktop e mobile).
5. Toggle EN/IT: `html.lang`, `aria-pressed`, cambio testo e italiano residuo.
6. Dark/light: `data-theme`, classe `dark`, persistenza dopo reload e colore body.
7. Link interni: risoluzione HTTP di tutti gli href locali unici.
8. Focus visibile da tastiera e skip-link.
9. `prefers-reduced-motion: reduce`.
10. Chatbot mobile: apertura/chiusura e sovrapposizione con header/nav.
11. Vincoli di prodotto: onboarding breve, no scelta buyer/seller, condizioni multi-select, upload foto, ricorrenza settimanale, data consegna, buy+sell, form preventivo.
12. Metadata: canonical, `og:url`, hreflang, sitemap, robots e dominio `vercel.app`.

## Severità

| Livello | Significato |
| --- | --- |
| `critical` | Blocca l'uso o la navigazione (es. menu sovrapposti). |
| `high` | Difetto funzionale o tecnico evidente (console, HTTP, immagini, overflow). |
| `medium` | Difetto UX/i18n/accessibilità o vincolo di prodotto non rispettato. |
| `low` | Miglioramento minore o struttura incompleta. |
| `info` | Osservazione utile, non bloccante. |

## Sicurezza

Nessuna chiave, token o segreto viene letto o scritto. Le verifiche usano solo URL locali/publici e dati demo già presenti; non vengono creati ordini, inviate richieste o modificate impostazioni.
