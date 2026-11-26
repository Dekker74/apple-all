# Offcut 2.1 — report finale di rifinitura

Data: 2026-11-26 · Branch: `feature/offcut-v2.1-polish` · Commit finale: `git rev-parse HEAD` (HEAD locale della branch, non pushato; SHA esatto riportato nella risposta finale). Commit dei sorgenti e degli artefatti: `ac61a94c7beb0ff52d38e94db11952bac11af1a5`.

## Stati

### Completato

- Refinitura visiva della homepage senza rimozione di sezioni o informazioni: tre revisioni documentate in [VISUAL_REVISIONS.md](/root/apple-all/qa/audit-v2.1/VISUAL_REVISIONS.md).
- Dashboard compatta con KPI e dati demo reali invariati; pannelli e azioni più densi, target mobile portati ad almeno 24 px.
- Marketplace e homepage con filtri/ordinamenti/stati vuoti invariati nella logica e più leggibili su mobile.
- IT/EN completi nei testi toccati, incluso greeting iniziale del chatbot e invio esplicito di `locale` a `/api/chat`.
- Tema e lingua persistenti con nuove chiavi (`offcut.lang`, `offcut-theme`, `offcut.bot`, `offcut-chat-history`, `offcut-chat-intro-shown`, `offcut-state-v1`) e fallback alle chiavi legacy.
- Rimozione dei riferimenti obsoleti in `src`/`public`: `hello@circularlink.app`, `apple-all.vercel.app`, `CircularLink` → conteggio 0. Contatti sostituiti con route interne `/preventivo` o testi senza indirizzi inventati.
- `teamAddress()` ora opzionale e basata solo su `QUOTE_NOTIFICATION_EMAIL`; senza env non vengono generati `mailto:` né email.
- Metadata, canonical, sitemap, robots e fallback quote aggiornati al dominio pubblico verificato.

### Testato

- `npm run typecheck`: exit 0 — [log](/root/apple-all/qa/logs/v21-typecheck-final-2.log).
- `npm run build`: exit 0 — [log](/root/apple-all/qa/logs/v21-build-final-2.log).
- `qa/verify.mjs --strict --out qa/audit-v2.1/after-strict-final-2`: 88 combinazioni route × viewport, 0 finding, exit 0 — [report](/root/apple-all/qa/audit-v2.1/after-strict-final-2/QA_REPORT.md).
- `qa/v21-audit.mjs --phase after`: 97 screenshot buyer/supplier/public, 0 finding, exit 0 — [report](/root/apple-all/qa/audit-v2.1/after/AUDIT_AFTER.md).
- `qa/v21-metrics.mjs --phase after`: 24 misurazioni su 8 viewport, 0 overflow, 0 target <24 px — [metriche](/root/apple-all/qa/audit-v2.1/after/METRICS.md).
- `qa/visual-review.mjs`: 14/14 screenshot, 0 errori — [confronto prima/dopo](/root/apple-all/qa/audit-v2.1/after/visual-review/CONTACT_SHEET.html).
- Account demo buyer (`Northwind Packaging · Bologna`) e supplier (`GreenLoop Fibres · Bologna`) verificati su homepage, marketplace, dettaglio materiale, dashboard, matches, inbox, orders, listings, requests, profilo, pubblicazione materiale, preventivi, login, registrazione, onboarding e recupero password.
- Viewport verificati: 360, 375, 390, 430, 768, 1024, 1440, 1920 px; light/dark e IT/EN.
- `npm run lint --if-present` e `npm test --if-present`: exit 0, ma il progetto non definisce script `lint` o `test`; quindi non costituiscono esecuzione di suite aggiuntive.

### Parzialmente implementato

- **Accessibilità WCAG 2.2 AA:** coperta da controlli automatici, focus/overflow/target e coerenza etichette; non eseguito audit manuale con screen reader.
- **Performance:** confrontate solo metriche DOM (altezze, overflow, target). Lighthouse non è stato eseguito; non vengono dichiarati punteggi LCP/CLS/INP non misurati.
- **Revisione visiva umana:** tre revisioni e screenshot prima/dopo prodotti, ma il modello corrente non può analizzare direttamente le immagini PNG. La valutazione critica si basa su metriche DOM/CSS e struttura, non su percezione visiva diretta.
- **Tablet 768/1024:** compattazione homepage rispettivamente −17,2% e −19,7%, sotto la soglia indicativa del 20% per preservare leggibilità dei pannelli.

### Bloccato

- **Database/Supabase:** backup non verificabile (nessun dump locale, CLI `supabase` assente, nessun connector Supabase nel progetto Vercel, nessuna chiave `service_role` registrata). Nessuna modifica a schema, RLS, storage o dati reali; rollback DB non garantito.
- **Produzione:** deploy non autorizzato; deployment Vercel di produzione resta invariato.
- **Preview Vercel:** non pubblicata; non è stata creata alcuna URL preview.
- **Push GitHub:** non eseguito (CLI senza credenziali); commit solo locale.
- **Analisi visiva diretta dei PNG:** non supportata dal modello corrente; dichiarata in [VISUAL_REVISIONS.md](/root/apple-all/qa/audit-v2.1/VISUAL_REVISIONS.md).

## Modifiche principali

- `src/components/landing/landing.module.css`: compattazione ritmo verticale, hero, griglie mobile, FAQ, CTA e footer. Nessuna sezione rimossa.
- `src/components/app/offcut-ux-primitives.tsx`, `src/app/app/dashboard/page.tsx`, `src/components/material/match-card.tsx`: densità e target cliccabili nella dashboard/marketplace.
- `src/components/chat-widget.tsx`, `src/app/api/chat/route.ts`: greeting coerente con la lingua, conversione dei messaggi iniziali quando non è iniziata una conversazione reale, `locale` esplicito al backend e istruzione di sistema che fissa la lingua di risposta.
- `src/lib/i18n.tsx`, `src/components/theme-provider.tsx`, `src/lib/store.ts`, `src/components/marketing/*`: nuove storage key con fallback legacy e testi localizzati.
- `src/app/api/quotes/route.ts`, `src/lib/quotes/email.ts`, pagine privacy/terms/preventivo/auth/simple-shell/copy: rimozione contatti obsoleti e fallback email sicuro.
- `qa/verify.mjs`, `qa/visual-review.mjs`, `qa/v21-audit.mjs`, `qa/v21-metrics.mjs`: script read-only per audit finale; il filtro su `net::ERR_ABORTED` esclude solo prefetch/RSC annullati dalle navigazioni.

## Non modificato

- `main` locale (`0b96cc3`), `origin/main` (`a3de235`) e `feature/offcut-2.0` (`0b96cc3`): refs invariati.
- Modello commerciale browser-only/dimo, commissione 6%, prezzi, trasporto, lavorazione, IVA e processi di preventivo/ordine: invariati.
- Database, Supabase, RLS, storage, env e segreti: invariati; nessuna credenziale aggiunta al repository.
- Deployment Vercel di produzione: invariato.

## Bug reali corretti

- Riferimenti a `hello@circularlink.app`, vecchio dominio e vecchio brand rimossi da codice e copy; non sostituiti con contatti inventati.
- Footer auth con testo non localizzato: ora usa la chiave `nav.cta`.
- Chatbot: messaggio iniziale e risposte AI ora seguono la lingua scelta; lo storico non convertito resta intatto quando l'utente ha già conversato.
- `teamAddress()` non restituisce più un indirizzo inventato quando la env manca; email e `mailto:` non vengono generati.
- Target inferiori a 24 px nella dashboard su mobile: corretti senza cambiare dati o azioni.
- Voci QA obsolete: dominio atteso aggiornato al dominio pubblico verificato e `ERR_ABORTED` di prefetch non più conteggiato come errore di rete.

### Transienti verificati, non bug applicativi

- Un primo audit after mostrò `/app/requests` quasi vuoto e un mismatch di hydration su `/app/requests/new`: riproduzione mirata e audit ripetuto diedero 0 finding; classificati come transienti del dev server durante ricompilazione.
- Un verify strict su dev server mostrò 2 aborti HMR; su build di produzione mostrò 24 aborti di prefetch/RSC. Dopo aver distinto gli aborti legittimi di navigazione, il verify finale su server di produzione è 0 finding.

## Backup, rollback e pubblicazione

- Backup verificato: `/root/offcut-backups/offcut-v2.1-polish-20261126T115056Z/` con bundle Git (`bundle is okay`, `complete history`), tar sorgente e checksum SHA256.
- Tag annotato protettivo: `offcut-v2.0-before-polish` (oggetto tag `04b1b7f726dd5acd576a7ea6477fcb68ba42f5a7`).
- Branch di backup: `backup/offcut-v2.0` (`0b96cc3`). Nessun tag o branch esistente sovrascritto.
- Procedura: [BACKUP_AND_ROLLBACK.md](/root/apple-all/BACKUP_AND_ROLLBACK.md).
- Rollback codice: checkout di `backup/offcut-v2.0` o `offcut-v2.0-before-polish`, oppure ripristino dal bundle verificato. Rollback DB non garantito.
- Vercel produzione: deployment `dpl_CNHfPhi6MSzPZ8jJ51KVS7UoN2xX`, target `production`, `READY`, commit `72aa750`. Candidato rollback pre-redesign: `dpl_Hd6Ce3N3aX8m2jZxigWbMRgmVYEg`, commit `a3de235`.
- URL pubblico verificato (invariato): `https://apple-all-andrea-grecos-projects.vercel.app`. `https://apple-all.vercel.app` risulta 404.
- URL preview: nessuna.

## Confronto economico con 2.0

Nessuna variazione: la rifinitura ha toccato layout, copy, localizzazione e controlli QA. Non sono state modificate le formule di prezzo, la commissione 6%, le voci di trasporto/lavorazione/IVA, né i flussi di prenotazione o ordine. I KPI della dashboard continuano a leggere gli stessi dati demo.

## Artefatti

- Baseline strict: `qa/audit-v2.1/before/QA_REPORT.md`.
- Audit completo before: `qa/audit-v2.1/before/AUDIT_BEFORE.md`.
- Metriche before/after: `qa/audit-v2.1/before/METRICS.md`, `qa/audit-v2.1/after/METRICS.md`.
- Audit completo after: `qa/audit-v2.1/after/AUDIT_AFTER.md`.
- Verify strict finale: `qa/audit-v2.1/after-strict-final-2/QA_REPORT.md`.
- Log ed exit code: `qa/logs/`.
- Screenshot prima/dopo e contact sheet: `qa/audit-v2.1/before/visual-review/`, `qa/audit-v2.1/after/visual-review/`.
