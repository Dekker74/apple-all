# Offcut 2.0 — Matrice di conformità al Master Prompt originale

Generata: 2026-11-26 · Worktree: `/root/apple-all` · Prompt sorgente: 1604 righe, 37 sezioni.

## Metodo di calcolo della conformità

Ogni sezione riceve uno dei quattro stati richiesti e un peso:

| Stato | Peso |
| --- | --- |
| Completato | 1,00 |
| Parzialmente completato | 0,50 |
| Implementato ma non verificato | 0,50 |
| Non completato | 0,00 |

`Conformità = somma dei pesi / 37 × 100`. Il peso 0,50 per "Implementato ma non verificato" indica che il lavoro è presente ma manca un riscontro esecutivo; non equivale a "Completato". Le sezioni con dipendenze esterne non disponibili (database Supabase, staging, Lighthouse, approvazione al deploy) sono deliberatamente classificate come parziali o non verificate.

**Risultato: 17 Completato · 19 Parzialmente completato · 1 Implementato ma non verificato · 0 Non completato → (17 × 1 + 19 × 0,5 + 1 × 0,5) / 37 = 73 %.**

## Matrice completa (37 sezioni)

| # | Sezione | Stato | Evidenza verificabile | Limiti / note |
| --- | --- | --- | --- | --- |
| 1 | Ruolo e obiettivo | Parzialmente completato | Consegna integrata di redesign, UX, codice, sicurezza e QA in `/root/apple-all`. | Il ruolo di team multidisciplinare è stato coperto da un solo agente come richiesto dall'utente (nessun sub-agente), non da figure separate. |
| 2 | Modello di business invariato | Completato | `src/lib/pricing.ts`, `src/lib/matching.ts`, commissione 6%, trasporto e lavorazione invariati; `qa/FINAL_FLOW_REPORT.md` verifica riepiloghi economici e preventivo `preventivo-CL-2026-0139.txt`. | Nessun abbonamento, paywall, nuovo listino o nuova commissione introdotto. |
| 3 | Backup completo | Parzialmente completato | Tag `backup/pre-premium-redesign` (`a3de235`), tag `backup/pre-dark-green` (`1b18348`), branch di backup, `ROLLBACK_PREMIUM_REDESIGN.md`, screenshot `qa/visual-before/`. | Backup di database, schema, RLS, storage e traduzioni non verificabili; nessuno staging isolato confermato; i ref con i nomi esatti del prompt sono stati creati localmente: tag `offcut-original-pre-redesign` e branch `backup/offcut-original` su `a3de235`, branch `feature/offcut-2.0` sullo stato di sviluppo. Produzione remota non raggiungibile (`404 DEPLOYMENT_NOT_FOUND`, log `qa/logs/production-availability.log`). |
| 4 | Analisi del sito attuale | Parzialmente completato | Lettura integrale delle 1604 righe del prompt, Account demo buyer/supplier, 5 screenshot pre-redesign da `a3de235`, audit in `docs/SECURITY_AUDIT.md` e `docs/i18n-gaps.md`. | Analisi di database, integrazioni esterne e comportamento storico in produzione limitata: la produzione risponde 404. |
| 5 | Direzione artistica Premium Industrial B2B | Completato | `DESIGN.md`, `src/app/apple.css`, `src/components/landing/`; riferimenti Apple/Stripe/Linear/Xometry/Cirplus tradotti in gerarchia, tipografia e spaziature proprie. | Il giudizio estetico sui pixel resta soggettivo; le misure oggettive sono in `qa/AESTHETIC_REVIEW.md`. |
| 6 | Eliminazione estetica AI | Completato | Nessun gradiente generico, glow, glassmorphism, emoji o animazione continua; `qa/targeted-final.log` verifica 0 emoji, icona SVG, 0 animazioni; `qa/AESTHETIC_REVIEW.md` 0 finding. | Badge di stato presenti solo dove collegati a stati reali. |
| 7 | Identità visiva Offcut | Completato | Nome e logo preservati (`src/components/offcut/logo.tsx`, wrapper SVG con PNG fornito), verde come accento, superfici neutre, token `--bg`, `--sf`, `--apple-blue`, `--apple-blue-on-dark`, `--moss`, `--mint`. | Palette adattata per accessibilità rispetto ai valori indicativi del prompt. |
| 8 | Design system centralizzato | Completato | `src/app/globals.css` → `offcut.css` → `apple.css` (ordine finale), token, primitive in `src/components/ui/` e `src/components/forms/`, breakpoint 360–1920. | Nessuna libreria di design esterna acquistata. |
| 9 | Principi UX | Completato | Form brevi, selezione multipla condizioni, bozze locali, anteprima, feedback e messaggi di errore; `qa/FINAL_FLOW_REPORT.md` 18 PASS. | Conferma esplicita non richiesta per azioni irreversibili non implementate nell'app demo. |
| 10 | Redesign homepage | Completato | `src/components/landing/landing-page.tsx` e `copy.ts`: hero, come funziona, percorsi buyer/supplier, materiali, anteprima marketplace, matching, trasporto, impatto, azienda, FAQ, CTA, footer. | Nessun cliente, testimonianza o statistica inventata. |
| 11 | Fotografia e immagini | Parzialmente completato | Immagini industriali locali in `public/images/`, `next/image`, lazy loading verificato in `qa/logs/targeted-review.log`, 0 immagini rotte in 14 screenshot. | Licenze/provenienza di ogni asset non documentate; categoria "metalli" non presente nel percorso prodotto (carta, legno, plastica). |
| 12 | Header e navigazione | Parzialmente completato | Header pubblico minimale con EN/IT e tema; app bar a due livelli con scrollbar verde e snap; hit-test link in `qa/verify.mjs`. | Navigazione operativa a barra superiore invece della sidebar desktop richiesta; bottom navigation mobile non implementata. |
| 13 | Login, registrazione, onboarding | Completato | Demo buyer/supplier, validazione, recupero password, toggle password, onboarding in 2 step senza scelta di ruolo; `qa/FINAL_FLOW_REPORT.md`. | Isolamento server-side degli account demo non dimostrato (stato commerciale nel browser). |
| 14 | Dashboard buyer e supplier | Parzialmente completato | `src/app/app/dashboard/page.tsx`, KPI, attività recenti, notifiche, azioni rapide, skeleton; screenshot `dashboard-desktop-light-it.png`. | Aggiornamento dati non in tempo reale; non tutti i KPI sono cliccabili; grafici non collegati a un backend reale. |
| 15 | Marketplace B2B | Parzialmente completato | Ricerca, filtri categoria/condizione/quantità, ordinamento, conteggio risultati, card compatte con specifiche; `qa/FINAL_FLOW_REPORT.md`. | Assenti preferiti, confronto materiali, vista lista/grid, paginazione e mappa geografica. |
| 16 | Pagina dettaglio materiale | Parzialmente completato | `src/app/app/marketplace/[id]/page.tsx`: foto, quantità, prezzo, specifiche, trasporto, lavorazione, commissione, totale e materiali simili. | Sezione documentazione/allegati non implementata. |
| 17 | Pubblicazione materiali | Parzialmente completato | Wizard con categorie, condizioni multiple, quantità, prezzo, foto con drag & drop, anteprima, validazione, bozze, modifica e duplicazione; `qa/flow-review.mjs` 5/5 PASS. | Upload di documentazione non previsto; salvataggio bozze è locale al browser. |
| 18 | Matching | Completato | `src/lib/matching.ts` invariato; etichette qualitative (solida/da verificare/debole) e motivazioni, senza percentuali inventate; `qa/FINAL_FLOW_REPORT.md`. | Nessuna modifica ai criteri di matching. |
| 19 | Inbox e messaggistica | Parzialmente completato | `src/app/app/inbox/page.tsx`: elenco conversazioni, non letti, timestamp, anteprime e collegamenti; `qa/FINAL_FLOW_REPORT.md`. | Ricerca messaggi, allegati sicuri e aggiornamento in tempo reale non implementati. |
| 20 | Trasporto, processamento, transazioni | Completato | Timeline e stati reali, riepilogo economico, modalità di trasporto, download preventivo; `qa/FINAL_FLOW_REPORT.md` e `qa/FINAL_FLOW_REPORT.md` (voci trasporto/processing/transazioni). | Nessun tracking logistico inventato. |
| 21 | Calcolatore di impatto | Completato | `src/components/offcut/footprint-page.tsx`, slider, campi numerici, risultati dinamici, fattori medi documentati nel codice, distinzione stima/preventivo. | Export PDF non implementato; valutato non essenziale rispetto al preventivo testuale già disponibile. |
| 22 | Offcut AI | Parzialmente completato | Nome "Offcut AI" in tutti i componenti e nella KB; aperto solo su richiesta, no overlap su mobile, vocal features, KB allineata a matching qualitativo e prezzi reali; rate limit 20/min, payload 10 KB, CSP report-only; `qa/targeted-final.log`, `qa/chat-api-targeted.log`. | L'assistente non interroga dati aziendali reali né esegue azioni; risponde da knowledge base. CSP non ancora in modalità enforce. |
| 23 | Profilo e notifiche | Completato | `src/app/app/settings/page.tsx`, centro notifiche con eventi reali, rimozione badge verifica fittizia (`6a17ca4`), `qa/targeted-final.log`. | Persistenza server-side non verificata. |
| 24 | Mobile first | Completato | Viewport 360/375/390/430/768/1024/1440/1920; `qa/fixtures/routes.json`, sweep 360/375 con 0 overflow in 11 route, app nav raggiungibile; safe-area in `offcut.css`. | Bottom navigation non implementata; gesto a una mano non misurato su dispositivo fisico. |
| 25 | Animazioni e microinterazioni | Completato | Transizioni brevi, reveal una sola volta, skeleton in caricamento, `prefers-reduced-motion`; rimozione pulse chatbot e verifica 0 animazioni continue in 14 schermate (`qa/AESTHETIC_REVIEW.md`). | Nessun parallax o ritardo artificiale. |
| 26 | Testi e comunicazione | Parzialmente completato | Copy EN/IT rivista, logistica EN corretta (`working` → `lavorazione`), emoji rimossi; `docs/i18n-gaps.md` elenca residue hardcoded fuori dal percorso QA. | Revisione di ogni singola stringa non completata; residui noti in file non di ownership. |
| 27 | Light mode, dark mode, traduzioni | Completato | Preferenze prima dell'hydration in `src/app/layout.tsx`, 14 screenshot EN/IT dark/light, 0 residui linguistici nei test QA, formati locali in `src/components/forms/local-format.ts`. | `docs/i18n-gaps.md` segnala label non localizzate in componenti non toccati. |
| 28 | Empty state, loading, errori | Completato | `EmptyState`, `WorkSkeleton`, `StatusCallout`, sanitizzazione errori API, `qa/FINAL_FLOW_REPORT.md` (stato vuoto e errore). | Nessuno stack trace esposto nei percorsi testati. |
| 29 | Funzionalità aggiuntive | Parzialmente completato | Bozze, duplicazione annunci, export preventivo, notifiche contestuali, azioni rapide; `qa/FINAL_FLOW_REPORT.md`. | Preferiti, ricerche salvate, confronto, ricerca globale e tour guidato non implementati deliberatamente. |
| 30 | Performance | Parzialmente completato | Build produzione 28/28 pagine statiche, `optimizePackageImports`, lazy images, CSS/JS minimizzati da Next.js; log build in `qa/logs/`. | Lighthouse, LCP, INP e CLS **non misurati**: obiettivi 90/95/95/95, 2,5 s, 200 ms, 0,1 non dichiarati raggiunti. |
| 31 | SEO tecnico e accessibilità | Parzialmente completato | `src/app/sitemap.ts`, `robots.ts`, metadata/OG/canonical, `StructuredData`, `apple-icon.svg`, H1 unico, 0 link rotti e contrasto body 15,46:1 (light) / 21:1 (dark); `qa/verify.mjs`, `qa/AESTHETIC_REVIEW.md`. | Audit screen reader e WCAG 2.2 AA completo non eseguiti; hreflang non verificato. |
| 32 | Sicurezza e stabilità | Parzialmente completato | Header di sicurezza, CSP report-only, sanitizzazione `next` in auth callback, errori API senza dettagli provider, rate limit chat, validazione input; `docs/SECURITY_AUDIT.md`, `qa/targeted-final.log`. | Stato commerciale browser-only, RLS permissive su breakdown/stato, INSERT anonimo quote_requests, CSP non enforce, test in staging non eseguiti. |
| 33 | Controllo qualità | Parzialmente completato | **QA finale `node qa/verify.mjs --strict`: 88 route/viewport, 0 finding, exit code reale `0` (`qa/logs/qa-strict-final.exit`, log `qa/logs/qa-strict-final.log`, report `qa/QA_REPORT.md` generato alle 11:26:17 UTC)**. Inoltre `qa/final-flow-review.mjs` 18 PASS, `qa/targeted-final.mjs` 10 PASS, `qa/flow-review.mjs` 5/5, typecheck e build verdi con exit code separati. | Script lint assente in `package.json`; migrazioni DB e audit esaustivo di pulsanti non eseguiti. Il flag `--strict` è attivo ma il report etichetta la modalità come `full` (non quick): l'exit code è catturato da `PIPESTATUS[0]`, non da `tee`. |
| 34 | Revisione critica del design | Implementato ma non verificato | 5 screenshot "prima" da `a3de235` in `qa/visual-before/`, 14 screenshot finali in `qa/visual-review/`, due iterazioni di revisione misurabile in `qa/AESTHETIC_REVIEW.md`. | Il modello non supporta input immagine e `html_preview` è bloccato dal sandbox root: il giudizio creativo sui pixel non è verificato in questo ambiente. |
| 35 | Metodo di implementazione | Parzialmente completato | Commits incrementali per fase, rollback documentato, checklist in questo file, nessuna modifica distruttiva. | Staging non disponibile; i nomi dei branch del prompt sono stati creati localmente (vedi sezione 3) ma non pubblicati. |
| 36 | Report finale | Completato | Questo documento più `qa/QA_REPORT.md`, `qa/FINAL_FLOW_REPORT.md`, `qa/AESTHETIC_REVIEW.md`, `ROLLBACK_PREMIUM_REDESIGN.md`. | Nessun costo aggiuntivo; URL preview pubblico non generato senza autorizzazione. |
| 37 | Risultato finale atteso | Parzialmente completato | Homepage memorabile, dashboard operativa, marketplace intuitivo, funzionalità demo operative, mobile verificato su 8 viewport, modello economico invariato. | Deploy in produzione non autorizzato; Lighthouse, DB/staging e giudizio visivo umano mancanti. |

## Valutazioni separate

### Grafica
**Parzialmente completato.** Palette neutra con accenti verdi, gerarchia tipografica SF Pro, superfici pulite, assenza di pattern AI (emoji, glow, gradienti, animazioni continue) verificata via DOM. Confronto prima/dopo archiviato in `qa/visual-before/` e `qa/visual-review/`. Il giudizio sui pixel non è verificabile in questo ambiente (sezione 34).

### UX
**Completato.** Onboarding in 2 step, senza scelta di ruolo, acquisto+vendita simultanei, form brevi, condizioni multi-select, foto venditore, select allineate, ricorrenza settimanale, data di consegna scelta dall'acquirente, EN/IT, chatbot non intrusivo, preventivo scaricabile, modalità trasporto nell'ordine. Navigazione app a due livelli e link sempre raggiungibili su 360–1920 px.

### Funzionalità
**Parzialmente completato.** 18 flussi chiave PASS, 10 controlli mirati PASS, 5 regressioni annunci PASS, build e typecheck verdi. Funzioni opzionali non implementate (preferiti, confronto, paginazione, allegati inbox, documentazione annuncio, PDF impatto) e stato demo browser-only.

### Sicurezza
**Parzialmente completato.** Header, CSP report-only, rate limiting e sanitizzazione verificati; permangono i gap noti del database/RLS e l'assenza di staging. Nessun test invasivo in produzione.

### Performance
**Parzialmente completato.** Build statica e lazy loading verificati; metriche Lighthouse e Core Web Vitals non misurate, quindi gli obiettivi numerici del prompt non sono dichiarati raggiunti.

## Sintesi esecutiva

- **Compliance: 73 %** con il metodo di peso esplicito sopra.
- **Nessun requisito classificato "Non completato"**: le lacune sono dipendenze esterne, funzioni opzionali o verifiche impossibili nell'ambiente.
- **Bloccante operativo**: push, PR e deploy restano sospesi fino all'autorizzazione esplicita. La produzione remota attualmente risponde 404, quindi non è possibile usare URL pubblico come evidenza.
- **Prossime azioni dopo approvazione**: push via GitHub MCP (la CLI non ha credenziali), deploy Vercel senza dominio custom, misurazione Lighthouse e audit screen reader, backup database/staging con verifica di ripristino.
