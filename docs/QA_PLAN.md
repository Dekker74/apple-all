# Piano QA — Offcut 2.0 premium redesign

## 1. Perimetro

Questo piano copre la verifica del worktree locale `t3/qa-premium-redesign-suite` del repository `apple-all` e, su richiesta, di un base URL esplicito. La preview Vercel non è stata usata come target primario: se richiede SSO non si insiste e si riporta il limite.

Ownership esclusiva del sub-agent QA:

- `qa/**` (script, fixture, report, screenshot);
- `docs/QA_PLAN.md` (questo documento).

Non vengono toccati `src/**`, `public/**`, `package.json`, configurazioni, chiavi o segreti. Non vengono eseguiti push, deploy o PR. Non viene modificata la logica prezzi in `src/lib/pricing.ts`.

## 2. Obiettivi di verifica

Confermare che il redesign preservi:

- homepage memorabile e comprensibile (cosa fa Offcut, buy/sell, come funziona, CTA);
- onboarding in 2 passi, solo area Bologna, nessuna scelta buyer/seller in registrazione;
- buy e sell entrambi attivi, form brevi, condizioni multi-select, upload foto venditore;
- select allineate, ricorrenza settimanale, data consegna scelta dall'acquirente;
- EN/IT complete in tutte le schede, chatbot, download preventivo onesto, trasporto ordine;
- solo dominio `vercel.app`, con preferenza per `apple-all.vercel.app`;
- accessibilità WCAG 2.2 AA di base, focus visibile, contrasto adeguato, `prefers-reduced-motion`;
- assenza di overflow orizzontale e sovrapposizioni menu/header/app bar.

## 3. Matrice di copertura

### Route principali (11)

`/`, `/chi-siamo`, `/impatto`, `/preventivo`, `/login`, `/signup`, `/privacy`, `/terms`, `/app/dashboard`, `/app/marketplace`, `/app/orders`.

### Viewport (6)

390 × 844, 430 × 932, 768 × 1024, 1024 × 768, 1440 × 900, 1920 × 1080.

Totale: 66 combinazioni route × viewport.

### Route di approfondimento

`/app/listings/new`, `/app/requests/new`, `/app/marketplace/lst_occ`, `/app/settings`, `/forgot-password`, più una route inesistente per il comportamento 404.

## 4. Checks automatici

| ID | Check | Metodo | Severità default |
| --- | --- | --- | --- |
| C01 | Console JS e `pageerror` | listener Playwright su ogni route | high / critical |
| C02 | HTTP >= 400 e richieste fallite | listener response/requestfailed | high / medium |
| C03 | Immagini mancanti | `img.complete` + `naturalWidth` dopo eager load | high |
| C04 | Overflow orizzontale | `documentElement.scrollWidth` vs `innerWidth` + elementi offenders | high |
| C05 | Sovrapposizione menu/controlli | intersezione rettangoli header nav/ctrl e app nav/tools | critical |
| C06 | Link raggiungibili | hit-test `elementFromPoint` sui link nav | high |
| C07 | Active pill | presenza/visibilità di `a.on` nella app bar | medium |
| C08 | EN/IT | `html.lang`, `aria-pressed`, diff testo, lessico italiano residuo | high / medium |
| C09 | Dark/light | `data-theme`, `.dark`, body background, persistenza dopo reload | high |
| C10 | Link interni | GET di tutti gli href locali unici | high |
| C11 | Focus visibile | 8 Tab stop con verifica outline/box-shadow e skip-link | medium |
| C12 | Contrasto | luminanza stimata da colori CSS compositi, soglia WCAG AA | medium |
| C13 | `prefers-reduced-motion` | media query + animazioni/transizioni attive | medium |
| C14 | Chatbot mobile | apertura iniziale, overlap header/nav, close/reopen | medium |
| C15 | Vincoli prodotto | DOM snapshot su form/route dedicate | medium |
| C16 | Dominio e SEO tecnico | canonical, og:url, hreflang, sitemap.xml, robots.txt | high / low |

## 5. Esecuzione

```bash
npm ci
npx playwright install chromium
npm run dev -- --port 3100
node qa/verify.mjs --base=http://127.0.0.1:3100
npm run typecheck
npm run build
```

Lo script genera:

- `qa/QA_REPORT.md` — report leggibile;
- `qa/results.json` — dati strutturati;
- `qa/screenshots/*.png` — evidenze visive.

`--quick` riduce la matrice a 390/1440; `--strict` restituisce exit code 1 in presenza di finding `critical`/`high`.

## 6. Criteri di accettazione

- Nessun finding `critical` o `high`.
- Nessun overflow orizzontale non intenzionale nei 6 viewport.
- Nessuna sovrapposizione tra menu, controlli e chatbot.
- Tutti i link interni risolvono con HTTP < 400.
- Nessuna immagine rotta e nessun errore console/JS non atteso.
- Toggle EN/IT e dark/light funzionanti e persistenti.
- Focus visibile sui tab stop principali.
- Vincoli di business invariati (nessuna modifica a prezzi o commissioni).

## 7. Escalation al parent

Le correzioni di codice sorgente non sono di competenza del sub-agent QA. Eventuali finding che richiedono modifiche a `src/**`, `public/**`, `package.json` o configurazioni vengono segnalati nel report e nella risposta finale con severità, route/viewport ed evidenza. Il parent decide chi applica la fix e se rieseguire la suite.

## 8. Limiti dichiarati

- Verifica predominantemente locale; la preview Vercel non è stata usata come target primario.
- Il calcolo contrasto è una stima sui colori CSS compositi e non sostituisce un audit con screen reader.
- Lighthouse non è parte dello script proporzionato; può essere eseguito separatamente con browser tool.
- Download preventivo e pagamenti non sono stati eseguiti: richiederebbero creazione ordine/azioni irreversibili, evitate per policy.
