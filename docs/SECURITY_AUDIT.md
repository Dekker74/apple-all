# Offcut 2.0 — Security & Data Integrity Audit

**Data:** 2026-11-26  
**Commit esaminato:** `61de16b` (`docs: add premium redesign rollback point`)  
**Ambito:** audit read-only del repository `apple-all`; sito live `https://apple-all.vercel.app` non toccato, non testato in modo invasivo.  
**Metodo:** revisione statica di middleware/auth, client Supabase, migrazioni e policy RLS, route API (`/api/quotes`, `/api/chat`, `/api/_cleanup`, `/auth/callback`), gestione di `process.env`, validazione input, rate limiting, esposizione chiavi, logica prezzi/quote, redirect, output chatbot e gestione errori. Nessun segreto letto o inserito; nessun deploy, push o PR.

> Nota metodologica: il repository contiene due piani conviventi. (1) Un'applicazione "local-first" in cui sessione, annunci, match, ordini e preventivi sono salvati in `localStorage` tramite Zustand. (2) Uno schema Supabase con RLS e un client browser usato solo per auth e per l'insert dei lead. Molte conclusioni dipendono da questa separazione: le policy RLS proteggono il database, ma oggi **non proteggono i dati che l'applicazione usa davvero**.

---

## Sintesi esecutiva

| Severità | Conteggio | Tema dominante |
|---|---:|---|
| Critica/Alta | 7 | Autorizzazione solo lato client, RLS troppo permissiva su prezzi/stati, bypass anon dell'API lead, endpoint AI senza limiti, open redirect |
| Media | 7 | Rate limit inefficace, knowledge base chatbot disallineata, auth demo ibrida, hash password locali, permessi SECURITY DEFINER |
| Bassa | 4 | CSP assente, domini canonici incoerenti, dettagli provider restituiti al client, sessione Supabase non applicata |

**Giudizio sintetico:** non sono state trovate chiavi privilegiate nel frontend né SQL injection evidenti; l'HTML delle email è correttamente escapato e il rendering dei messaggi chatbot usa la sanitizzazione di React. Il rischio principale è di **integrità dei dati e autorizzazione**: chiunque apra gli strumenti per sviluppatori può modificare prezzi, ruoli, badge di verifica, stati degli ordini e sessione, perché non esiste un confine server-side per queste operazioni. In parallelo, le policy RLS consentono alle parti (e, per i match, a chiunque veda annunci/richieste pubbliche) di aggiornare campi commerciali che dovrebbero essere calcolati o bloccati.

---

## Findings — Critica / Alta

### A1. Autorizzazione applicativa assente: dati commerciali e sessione sono solo nel browser
**Evidenza**
- `src/lib/store.ts:485-487`, `src/lib/store.ts:490-522` — store Zustand condiviso; `signIn` confronta credenziali lette dallo store locale.
- `src/lib/store.ts:606-609` — `hydrateSession()` non carica alcuna sessione remota: `set({ authChecked: true })`.
- `src/lib/store.ts:617-700` — `completeOnboarding`, `updateOrganization` accettano un `patch` arbitrario senza check di ruolo.
- `src/lib/store.ts:759-1091` — `createListing`, `updateListingStatus`, `setMatchStatus`, `issueQuote`, `acceptQuote`, `scheduleCollection`, `completeOrder`, `cancelOrder` non verificano che l'utente appartenga all'org che possiede l'oggetto.
- `src/lib/store.ts:1217-1232` — persistenza integrale dello stato (inclusi `accounts` con hash password) in `localStorage`.
- `src/app/app/layout.tsx:21-38` — guard solo client-side con `router.replace`.
- `src/middleware.ts:8-34` — il middleware aggiorna i cookie Supabase ma non blocca nessuna rotta.

**Impatto:** un utente (o uno script eseguito nella console del browser) può impostare `session.userId` a piacere, modificare `verified`, `commissionRate` nei breakdown, prezzi, quantità, quote e stati d'ordine, e vedere/modificare oggetti di altre aziende presenti nello stato locale. Le protezioni Supabase non si applicano a questi dati: il modello di fiducia è il browser.

**Raccomandazione minima:** mantenere in `localStorage` solo preferenze UI e dati demo esplicitamente sintetici; spostare ogni mutazione di listings/request/match/quote/ordini in route server o RPC Supabase che derivino `org_id`/`user_id` dalla sessione verificata, mai dal body. Introdurre una guard server-side (o RLS) per `/app/*` prima di rendere dati reali.

---

### A2. RLS permette la modifica di breakdown, prezzi e stati tramite policy generiche
**Evidenza**
- `supabase/migrations/20260101000000_init.sql:327-353` — `is_request_visible()` e `is_listing_visible()` ritornano `true` per qualsiasi richiesta `open/matched` e annuncio `active/matched`, indipendentemente dall'utente.
- `supabase/migrations/20260101000000_init.sql:513-519` — `matches: parties can update` usa proprio quelle due funzioni, senza `WITH CHECK` e senza limitazione di colonne.
- `supabase/migrations/20260101000000_init.sql:530-540` — `orders` e `quotes`: `for update` per una delle due parti, su tutte le colonne, senza transizioni di stato.
- `supabase/migrations/20260101000000_init.sql:149`, `181-189` — `matches.breakdown` e `quotes.breakdown` sono `jsonb` liberi.

**Impatto:** in un progetto Supabase standard (privilegi di default su `public`), qualsiasi utente autenticato — e potenzialmente `anon` dove ha `SELECT`/`UPDATE` — può leggere e aggiornare il `breakdown` (commissione, trasporto, totale) di match altrui e modificare `status`, `quantity_kg`, `quote_id` e `valid_until` di ordini/preventivi di cui è parte. L'identità delle "parti" è inoltre allargata: per i match basta che annuncio e richiesta siano pubblici.

**Raccomandazione minima:** revocare `UPDATE` generico; esporre solo RPC `security definer` con argomenti tipizzati e validati (es. `accept_quote(order_id)`, `transition_order(order_id, next_status)`), con trigger che blocchino la modifica di `breakdown`, `org_id`, `quantity_kg` dopo l'emissione e che verifichino le transizioni. Riscrivere le policy `matches` usando l'appartenenza effettiva alle org di listing/request, non le funzioni di visibilità di mercato.

---

### A3. Verifica aziendale e ruoli modificabili dagli utenti
**Evidenza**
- `supabase/migrations/20260101000000_init.sql:466-480` — `organizations: admins can update` e `memberships: admins can update` su tutte le colonne; quest'ultima non ha `WITH CHECK` esplicito.
- `supabase/migrations/20260101000000_init.sql:54` — `organizations.verified boolean not null default false`.
- `src/app/app/settings/page.tsx:203-205`, `src/components/app/org-switcher.tsx:58`, `src/app/app/marketplace/[id]/page.tsx:231` — il badge "Partita IVA verificata" è mostrato in base a quel flag.
- `src/lib/store.ts:695-700` — l'aggiornamento dell'organizzazione nel client accetta `patch` arbitrario.

**Impatto:** owner/admin (o chi manipola lo store locale) possono auto-impostare `verified = true`, ottenere un badge KYC non reale, e un admin può promuovere sé stesso a `owner` o cambiare `user_id` di una membership. Viola il requisito "non mostrare badge di verifica se non esiste un processo reale".

**Raccomandazione minima:** rimuovere `verified` dall'UPDATE consentito agli utenti (trigger `BEFORE UPDATE` che mantiene il valore vecchio salvo che per una role `service_role`) e consentire il cambio di `role` solo a un `owner` diverso dal soggetto, con `WITH CHECK` esplicito.

---

### A4. Inserimento anonimo diretto in `quote_requests` aggira tutti i controlli dell'API
**Evidenza**
- `supabase/migrations/20261123000000_quote_requests.sql:38-49` — policy `for insert to anon, authenticated with check (true)` e `grant insert ... to anon, authenticated`.
- `src/lib/quotes/supabase.ts:31-37` — la scrittura server-side usa la chiave **anon** pubblica.
- `src/app/api/quotes/route.ts:17-46`, `60-70` — rate limit, honeypot e validazione vivono solo nella route HTTP.

**Impatto:** la chiave anon è per definizione pubblica nel bundle (`src/lib/supabase/client.ts:4-5`). Chiunque può chiamare direttamente `POST /rest/v1/quote_requests` con un body minimale, senza rate limit, senza honeypot e senza invio email, intasando il database e inquinando i lead.

**Raccomandazione minima:** rimuovere il grant INSERT ad `anon`/`authenticated` e scrivere la tabella solo da contesto server con credenziali dedicate (service role in ambiente server-only oppure RPC con token emesso dalla route). In alternativa temporanea, aggiungere un campo `request_token` verificato da trigger e un limite DB per IP/email.

---

### A5. `/api/chat` è pubblico, senza rate limit e con più chiamate AI per richiesta
**Evidenza**
- `src/app/api/chat/route.ts:62-75` — nessuna autenticazione, nessun rate limit, nessun controllo di dimensione del body.
- `src/app/api/chat/route.ts:79-123` — `history` accettata come array arbitrario e poi invata al modello; vengono provati fino a 4 modelli in sequenza.
- `src/components/chat-widget.tsx:246` — `maxLength={2000}` è solo lato client.

**Impatto:** richieste ripetute con payload grandi generano costi Gemini non controllati e possono esaurire quota/console; non essendoci timeout sulla `sendMessage`, una richiesta può rimanere aperta a lungo. È un vettore di economic DoS su un endpoint pubblico.

**Raccomandazione minima:** rate limit per IP/sessione con store condiviso (Vercel KV/Edge Config o provider), `Content-Length` e lunghezza reale del body ≤ 10 KB, `message` ≤ 2000 caratteri, `history` ≤ 20 messaggi con testo troncato, `AbortSignal.timeout` e un solo fallback di modello per richiesta.

---

### A6. Open redirect nel callback auth tramite parametro `next`
**Evidenza**
- `src/app/auth/callback/route.ts:12` — `const next = requestUrl.searchParams.get("next") ?? "/app/dashboard";`
- `src/app/auth/callback/route.ts:35-38` — dopo lo scambio del codice: `NextResponse.redirect(new URL(next, requestUrl.origin))`.

**Impatto:** un URL costruito come `/auth/callback?code=<valido>&next=https://evil.example` reindirizza l'utente (che ha appena effettuato l'accesso) verso un dominio esterno. Abilita phishing e login-CSRF. La UI non genera il parametro, ma l'endpoint lo accetta.

**Raccomandazione minima:** accettare solo percorsi relativi interni: verificare `next.startsWith("/") && !next.startsWith("//")`, oppure whitelist di prefissi (`/app`, `/onboarding`), altrimenti usare `/app/dashboard`.

---

### A7. Dettagli grezzi del provider AI restituiti al client
**Evidenza**
- `src/app/api/chat/route.ts:131-139` — in caso di errore: `console.error("Gemini API error:", error)` e risposta JSON con `details: error.message || "Unknown error"`.

**Impatto:** il messaggio d'errore del SDK può contenere informazioni interne (URL di richiesta con parametro `key`, modello, quota, dettagli di rete). Restituirlo a un chiamante non autenticato è un'informazione disclosure; inoltre il client mostra il testo grezzo all'utente (`src/components/chat-widget.tsx:121-127`).

**Raccomandazione minima:** rispondere con un messaggio generico (`{ error: "chat_unavailable" }`, 502/503), loggare l'errore solo server-side in forma sanitizzata (senza URL/query string) e correlare con un ID richiesta.

---

## Findings — Media

### M1. Rate limiting di `/api/quotes` aggirabile e non condiviso
**Evidenza**
- `src/app/api/quotes/route.ts:14-21` — `Map` in memoria; IP letto da `x-forwarded-for` (primo valore) o `x-real-ip`.
- `src/app/api/quotes/route.ts:23-37` — bucket per singola istanza; `RATE_LIMIT_MAX = 5` / 10 minuti.
- `src/app/api/quotes/route.ts:40-46` — applicato prima della validazione.

**Impatto:** su Vercel ogni istanza ha la propria `Map` (limite manyfold), gli header `X-Forwarded-For`/`X-Real-IP` sono controllabili dal client e la memoria è volatile. Il limite è una misura solo indicativa.

**Raccomandazione minima:** usare un contatore condiviso con chiave derivata dall'IP attendibile fornito dalla piattaforma (non dal primo valore di `X-Forwarded-For`), oppure WAF/rate limiting di Vercel; mantenere la `Map` solo come secondario.

---

### M2. Limite di payload basato solo su `Content-Length`
**Evidenza**
- `src/app/api/quotes/route.ts:10`, `48-58` — `MAX_BODY_BYTES = 10_000`, controllo del solo header dichiarato, poi `await request.json()`.
- `src/app/api/chat/route.ts:64` — nessun controllo analogo.

**Impatto:** un client può dichiarare `Content-Length: 0` (od ometterlo, usando chunked encoding) e inviare un corpo molto più grande, causando consumo di memoria/CPU prima della validazione.

**Raccomandazione minima:** leggere il body come testo con un contatore di byte (o limitare il stream di `request.body`) e rifiutare oltre 10 KB prima di `JSON.parse`; applicare lo stesso controllo a `/api/chat`.

---

### M3. Knowledge base del chatbot disallineata con prezzi, fattori ambientali e fantastic tracking
**Evidenza**
- `src/app/api/chat/route.ts:23-33` — KB hardcoded: "commissione 6%", "€120 fisso", "€45 servizio logistica", "€5/€15/€30 a tonnellata", "Prezzo finale = lordo - 6% commissione + trasporto + servizio + lavorazione", "tracciamento in tempo reale".
- `src/lib/constants.ts:97-113` — processing `0.025–0.14 €/kg`, `COMMISSION_RATE = 0.06`, `VAT_RATE = 0.22`.
- `src/lib/pricing.ts:43-63` — sconto volume, trasporto `(260 + km*1.85)*(...)+kg*0.011`, commissione **sommat** al materiale, IVA 22%.
- `src/components/marketing/footprint-calculator.tsx:12-15`, `src/components/offcut/footprint-page.tsx:11-14` — CO₂e: plastica 1.85, cartone 1.1, legno 0.92 t/t, diversi da 1.8/0.9/0.4 della KB.
- `src/app/api/chat/route.ts:20` — "Ogni match mostra ... compatibilità %", mentre `src/lib/matching.ts` produce `confidence` qualitative (`strong/review/weak`).

**Impatto:** l'assistente fornisce prezzi e formule errati (segno della commissione, voce "servizio" inesistente, costo lavorazione fuori scala), fattori ambientali diversi dal calcolatore e promette tracking non implementato. Informazioni commerciali non affidabili, con rischio di contestazioni e violazione del vincolo "non inventare prezzi".

**Raccomandazione minima:** generare la KB dal codice (importare `COMMISSION_RATE`, `PROCESSING_MAP`, fattori del calcolatore) invece di duplicarla; rimuovere "servizio €45", "trasporto fisso €120", la formula con segno negativo, le percentuali di compatibilità e il tracking; far rispondere il bot con "prezzo indicativo, il preventivo ufficiale è calcolato dalla piattaforma".

---

### M4. Output LLM senza guardrail e contesto conversazionale non limitato
**Evidenza**
- `src/app/api/chat/route.ts:64-105` — `message` e `history` sono concatenati nel contesto inviato al modello; solo il tipo e il ruolo sono controllati, non il contenuto.
- `src/app/api/chat/route.ts:118-124` — la risposta viene restituita così com'è (`result.response.text()`).
- `src/components/chat-widget.tsx:213-217` — lato positivo: la risposta è renderizzata come testo in `<p>{t(msg.content)}</p>`, quindi non c'è `dangerouslySetInnerHTML` né XSS diretto.

**Impatto:** prompt injection può indurre il modello a ignorare il system prompt, rivelare le istruzioni interne o generare URL/valori commerciali non validati. Non c'è post-validazione di numeri, link o lunghezza della risposta.

**Raccomandazione minima:** limitare lunghezza e numero dei messaggi di storia, aggiungere all'istruzione un divieto esplicito di riportare il system prompt e di produrre URL o prezzi non presenti nella KB, troncare la risposta e rimuovere URL non appartenenti al dominio atteso prima del rendering (mantenendo il rendering testuale).

---

### M5. Fallback SSO autentica silenziosamente come account demo
**Evidenza**
- `src/lib/store.ts:585-604` — se Supabase non è configurato, `signInWithProvider("google"|"azure")` imposta `session.userId = "usr_elena"` senza password.
- `src/lib/constants.ts:242-247` — email e password demo sono pubbliche nel bundle.

**Impatto:** un pulsante "Accedi con Google/Azure" può invece assegnare la sessione dell'account demo buyer senza alcuna verifica dell'identità. Se la configurazione Supabase venisse a mancare in produzione, l'accesso "SSO" diventa un accesso demo non autentico.

**Raccomandazione minima:** disabilitare i pulsanti SSO quando `isSupabaseConfigured === false`; rimuovere il percorso demo dal metodo SSO. Mantenere le due azioni demo esplicite ed etichettate, con il solo scopo di mostrare dati sintetici.

---

### M6. Password degli account "reali" memorizzate come SHA-256 salato in `localStorage`
**Evidenza**
- `src/lib/store.ts:400-413` — `hashPassword()` usa `crypto.subtle.digest("SHA-256", salt + ":" + password)`.
- `src/lib/store.ts:546-563`, `1227-1232` — hash e salt sono salvati nello store persistente.
- `src/lib/store.ts:535-544` — contemporaneamente viene creato un utente Supabase Auth, ma il login dell'app usa solo lo store locale.

**Impatto:** SHA-256 con sale è una KDF veloce e non adatta alle password; l'hash è modificabile e leggibile da qualsiasi script con accesso al browser. Un utente può cambiare il proprio hash, impersonare un altro profilo locale o aggirare il login. La password demo è per scopo pubblica (`src/lib/constants.ts:247`) e non deve mai essere riutilizzata per account reali.

**Raccomandazione minima:** non salvare password/hash nel client per account reali: usare esclusivamente Supabase Auth (`signInWithPassword`) e la sessione cookie; limitare il flusso locale a demo flag senza credenziali. Se una KDF locale fosse davvero necessaria, usare PBKDF2/Argon2 con parametri elevati e non considerarla un confine di sicurezza.

---

### M7. Funzioni `SECURITY DEFINER` con permessi di default e `search_path = public`
**Evidenza**
- `supabase/migrations/20260101000000_init.sql:282-353` — `is_org_member`, `has_org_role`, `can_access_order`, `is_request_visible`, `is_listing_visible`: `security definer`, `set search_path = public`, senza `revoke ... from public`.
- `supabase/migrations/20261123010000_chats.sql:29-43` — `can_access_chat` con `grant execute ... to authenticated` ma senza `revoke` dal ruolo `PUBLIC`.

**Impatto:** in PostgreSQL i permessi di esecuzione sulle funzioni sono concessi a `PUBLIC` per default; le funzioni restano quindi invocabili anche da ruoli non autenticati (con `auth.uid()` nullo nella maggior parte dei casi, ma è una superficie inutile). `search_path = public` è meno restrittivo della best practice e rende le funzioni dipendenti da oggetti risolvibili nello schema public.

**Raccomandazione minima:** aggiungere `revoke all on function <nome>(...) from public; grant execute ... to authenticated;` e usare `set search_path = ''` referenziando gli oggetti come `public.memberships`, `auth.uid()`, ecc.

---

## Findings — Bassa

### L1. Nessuna Content-Security-Policy
**Evidenza:** `next.config.ts:12-24` — header presenti: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `COOP`, `X-DNS-Prefetch-Control`; assente `Content-Security-Policy`.  
**Impatto:** in caso di XSS (per esempio via contenuto non fidato futuro) non c'è un secondo livello di difesa. Oggi il rendering React e l'escape delle email limitano il rischio, ma la difesa in profondità manca.  
**Raccomandazione minima:** distribuire prima una CSP in `Content-Security-Policy-Report-Only`, poi applicarla con nonce per gli script Next.js e `connect-src` limitato a Supabase/Resend/Gemini.

---

### L2. Dominio canonico e link email incoerenti
**Evidenza**
- `.env.example:6` — `NEXT_PUBLIC_SITE_URL=https://all-1-2026.vercel.app`.
- `src/app/layout.tsx:11` — fallback `https://apple-all.vercel.app`.
- `src/app/sitemap.ts:3`, `src/app/robots.ts:3`, `src/app/preventivo/layout.tsx:3`, `src/app/terms/layout.tsx:3`, `src/lib/quotes/email.ts:36` — fallback `https://all-1-2026.vercel.app`.

**Impatto:** se la variabile non è impostata correttamente, canonical/OG/sitemap e link nelle email di conferma puntano a un dominio diverso dal sito live, con effetti SEO e potenziale confusione per i destinatari.  
**Raccomandazione minima:** impostare `NEXT_PUBLIC_SITE_URL=https://apple-all.vercel.app` nell'ambiente Vercel e uniformire tutti i fallback a quel valore (o a una costante condivisa).

---

### L3. Dettaglio provider restituito nella risposta del form preventivo
**Evidenza**
- `src/app/api/quotes/route.ts:128` — `...(email.sent && email.confirmationDetail ? { confirmationDetail: email.confirmationDetail } : {})`.
- `src/lib/quotes/email.ts:186-200` — `confirmationDetail` contiene il testo grezzo restituito da Resend in caso di errore della conferma.

**Impatto:** informazioni di errore del provider (non necessarie all'utente) finiscono nel client; `src/lib/quotes/supabase.ts:52,59` fa invece cosa corretta troncando e salvando l'errore solo in DB.  
**Raccomandazione minima:** rimuovere `confirmationDetail` dalla risposta; tenere il dettaglio solo nei log/server e restituire al massimo un codice sintetico (`email_confirmation_failed`).

---

### L4. Sessione Supabase non sincronizzata con lo store applicativo
**Evidenza**
- `src/app/auth/callback/route.ts:35-38` — scambia il codice e imposta il cookie Supabase.
- `src/lib/store.ts:459-483` — `applySupabaseUser()` esiste ma non è mai chiamato (nessun riferimento nel repository).
- `src/lib/store.ts:606-609` — `hydrateSession()` non legge `supabase.auth.getUser()`.

**Impatto:** un accesso OAuth/magic-link può riuscire a livello Supabase senza produrre una sessione applicativa; viceversa l'app può mostrare un utente "locale" anche senza sessione Supabase. Gli stati delle due autorizzazioni divergono.  
**Raccomandazione minima:** implementare `hydrateSession` leggendo l'utente Supabase e mappandolo nello store tramite `applySupabaseUser`, oppure rimuovere del tutto il dualismo se la modalità demo locale è l'unica supportata.

---

## Controlli risultati compliant (nessuna azione richiesta)

- **Segreti:** `GEMINI_API_KEY` e `RESEND_API_KEY` sono referenziati solo in codice server (`src/app/api/chat/route.ts:4,70`, `src/lib/quotes/email.ts:168`); `.env.example:1` vieta esplicitamente `service_role`; nessuna chiave privilegiata è presente nel repository o nei file `.env*` tracciati. La chiave Supabase usata è solo quella `anon` pubblica (`src/lib/supabase/client.ts:4-5`).
- **SQL injection:** tutte le interazioni Supabase usano il client parametrizzato (`src/lib/quotes/supabase.ts:39-56`); le migrazioni usano funzioni SQL con parametri, non concatenazione di input utente.
- **XSS / HTML injection:** `escapeHtml()` copre tutti i campi variabili nelle email (`src/lib/quotes/email.ts:18-25,88-127`); `src/components/structured-data.tsx:28` escape `<`; `src/app/layout.tsx:52` inietta solo uno script statico senza dati utente; i messaggi chatbot sono renderizzati come testo da React.
- **Validazione lead:** `src/lib/quotes/schema.ts:32-87` valida intent, materiale ammesso, quantità, zona, email, lunghezze e honeypot; la migration `20261123000000_quote_requests.sql:8-25` replica i vincoli a DB.
- **Header di sicurezza di base:** `next.config.ts:13-23`; `src/app/robots.ts:10` vieta l'indicizzazione di `/app`, `/api`, `/auth` e delle pagine di accesso.
- **Endpoint di diagnostica:** `src/app/api/_cleanup/route.ts:3-6` è un 404 statico senza effetti collaterali.

---

## Verifiche eseguite e stato

| Verifica | Comando / azione | Esito |
|---|---|---|
| Installazione dipendenze | `npm ci --no-audit --no-fund` | OK — 179 pacchetti, solo `node_modules` (ignorato da Git) |
| Type checking | `npm run typecheck` | **Superato** — `tsc --noEmit`, nessun errore |
| Build produzione | `npm run build` | **Superato** — Next.js 15.5.29, 28/28 pagine generate, nessun errore |
| Test dinamici su produzione | Non eseguiti (vincolo di audit read-only e non invasivo) | N/A |
| Segreti / credenziali | Solo lettura di nomi di variabili; nessun valore segreto letto | OK |

### Risultati comandi

```
$ npm run typecheck
> tsc --noEmit
# nessun output di errore — exit 0

$ npm run build
> next build
✓ Compiled successfully
✓ Generating static pages (28/28)
Route (app) ... ƒ /api/chat, ƒ /api/quotes, ƒ /auth/callback, ƒ Middleware
```

Il build ha emesso solo warning di performance del cache webpack su stringhe grandi (116 KiB e 272 KiB), senza impatto sulla correttezza. Nessun file sorgente è stato modificato da questi comandi.
