# Gap i18n fuori ownership

Audit del 26 novembre 2026 sul worktree `apple-all`. Questo task ha coperto solo i file di ownership indicati nel brief. I file seguenti **non sono stati modificati** e restano di competenza degli altri agenti: contengono italiano hardcoded, copy di dati in italiano o label accessibili non localizzate. Vanno gestiti con COPY locale (`CONTENT.it` / `CONTENT.en`) oppure con `t()` nei componenti client. Per `src/lib/pricing.ts` verificare solo le etichette: **non modificare la logica prezzi**.

## Sito pubblico e marketing

| File | Punti da verificare | Azione |
| --- | --- | --- |
| `src/app/page.tsx` | Hero, problemi, how-it-works, materiali, prezzi, FAQ, CTA finali. | COPY locale / `t()` |
| `src/components/landing/**` | Schede e sezioni della landing con testi italiani. | COPY locale per ogni componente |
| `src/components/offcut/about-page.tsx` | Titoli, paragrafi, elenco materiali, CTA “GET IN TOUCH”. | COPY locale |
| `src/components/offcut/footprint-page.tsx` | Copy del calcolatore impatto e note sui dati. | COPY locale |
| `src/components/marketing/footprint-calculator.tsx` | Etichette form, risultati e messaggi di errore. | COPY locale |
| `src/components/marketing/assistant-bot.tsx` | Risposte bot: commissione 6%, tempi di risposta, upload foto. | COPY locale |
| `src/components/marketing/simple-shell.tsx` | Skip link “Vai al contenuto / Skip to content” e testi del guscio. | COPY locale / `t()` |
| `src/components/offcut/bot-card.tsx` | Domande suggerite e testi chat. | COPY locale |
| `src/components/chat-widget.tsx` | Aria label, placeholder, messaggi di stato e suggerimenti. | COPY locale / `t()` |
| `src/app/api/chat/route.ts` | Prompt di sistema e messaggi di errore in italiano. | COPY locale lato API |
| `src/app/chi-siamo/layout.tsx`, `src/app/chi-siamo/page.tsx` | Metadata e testi della pagina Chi siamo; fallback `https://all-1-2026.vercel.app`. | COPY locale + metadata EN + dominio corretto |
| `src/app/impatto/layout.tsx`, `src/app/impatto/page.tsx` | Metadata “Calcolatore impatto”, testi pagina e fallback `https://all-1-2026.vercel.app`. | COPY locale + metadata EN + dominio corretto |

## Auth, onboarding e preventivo

| File | Punti da verificare | Azione |
| --- | --- | --- |
| `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/forgot-password/page.tsx` | Metadata e titoli di pagina in italiano. | Metadata EN coerente con root |
| `src/components/auth/auth-shell.tsx`, `src/components/offcut/auth-shell.tsx` | Testi aside, badge e footer legale. | COPY locale |
| `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx` | Errori e messaggi: “Non è stato possibile…”, “Hai già un account?”. | COPY locale / `t()` |
| `src/app/auth/callback/route.ts` | Messaggi di errore di callback. | COPY locale lato API |
| `src/app/onboarding/page.tsx` | Etichette wizard, validazioni e toast in italiano. | COPY locale / `t()` |
| `src/app/preventivo/layout.tsx`, `src/app/preventivo/page.tsx` | Metadata e copy del form preventivo; fallback `https://all-1-2026.vercel.app`. | COPY locale + metadata EN + dominio corretto |
| `src/lib/quotes/email.ts` | “Ricevuta il …”, firma email e fallback `https://all-1-2026.vercel.app`. | COPY locale + fallback `https://apple-all.vercel.app` |
| `src/lib/quotes/mailto.ts`, `src/lib/quotes/schema.ts`, `src/lib/quotes/supabase.ts` | Oggetti, corpi e messaggi di errore legati al preventivo. | COPY locale |
| `src/app/api/quotes/route.ts`, `src/app/api/_cleanup/route.ts` | Risposte API e messaggi di errore in italiano. | COPY locale lato API |

## Area applicativa autenticata

| File | Punti da verificare | Azione |
| --- | --- | --- |
| `src/app/app/layout.tsx` | Testi del guscio applicativo e fallback. | COPY locale / `t()` |
| `src/app/app/dashboard/page.tsx` | KPI, feed abbinamenti, stati e CTA. | COPY locale / `t()` |
| `src/app/app/inbox/layout.tsx`, `src/app/app/inbox/page.tsx` | Titoli, messaggi e sticky in italiano. | COPY locale |
| `src/app/app/listings/new/page.tsx`, `src/app/app/listings/page.tsx` | Form annuncio in 4 passi, validazioni, stati. | COPY locale / `t()` |
| `src/app/app/marketplace/page.tsx`, `src/app/app/marketplace/[id]/page.tsx` | Filtri, schede materiale, dettaglio e stime consegnate. | COPY locale / `t()` |
| `src/app/app/matches/page.tsx` | Feed AI, punteggi e motivazioni. | COPY locale / `t()` |
| `src/app/app/orders/page.tsx`, `src/app/app/orders/[id]/page.tsx` | Pipeline ordini, preventivi, logistica e certificati. | COPY locale / `t()` |
| `src/app/app/requests/new/page.tsx`, `src/app/app/requests/page.tsx` | Form domanda, ricorrenza settimanale e data consegna acquirente. | COPY locale / `t()` |
| `src/app/app/settings/page.tsx` | Dati azienda, sedi, membri e preferenze. | COPY locale / `t()` |
| `src/components/app/app-nav.tsx` | `ITEMS` con “Panoramica”, “Cerca materiali”, “I tuoi ordini”. | COPY locale / `t()` |
| `src/components/app/app-shell.tsx` | Classi e wrapper; verificare solo testi residui. | `t()` se presenti |
| `src/components/app/booking-modal.tsx` | Form appuntamento, fasce orarie, validazioni. | COPY locale / `t()` |
| `src/components/app/global-search.tsx`, `src/components/app/notification-menu.tsx`, `src/components/app/org-switcher.tsx`, `src/components/app/user-menu.tsx` | Aria label, menu e notifiche. | COPY locale / `t()` |
| `src/components/app/page-header.tsx`, `src/components/app/stat-card.tsx` | Eyebrow, titoli e footnote delle card. | COPY locale / `t()` |

## Dati, componenti materiale e logica condivisa

| File | Punti da verificare | Azione |
| --- | --- | --- |
| `src/components/city-selector.tsx`, `src/lib/emilia-romagna-cities.ts` | Nomi città e label selettore. | COPY locale / mantenere Bologna |
| `src/components/material/category-icon.tsx`, `listing-card.tsx`, `match-card.tsx`, `material-thumb.tsx`, `price-breakdown.tsx`, `status-badge.tsx` | Etichette materiale, condizioni, status e voci prezzo. | COPY locale / `t()` |
| `src/lib/constants.ts`, `src/lib/seed.ts`, `src/types/index.ts` | Descrizioni materiale, condizioni e nomi seed in italiano. | COPY locale dei dati mostrati |
| `src/lib/matching.ts`, `src/lib/store.ts`, `src/lib/format.ts` | Motivazioni, status e formattazioni in italiano. | COPY locale; caller con `t()` |
| `src/lib/pricing.ts` | Solo etichette eventuali delle voci prezzo. | **Solo COPY, non logica** |

## SEO e radice

| File | Punti da verificare | Azione |
| --- | --- | --- |
| `src/app/layout.tsx` | `<html lang="it">` fissato mentre la lingua predefinita del provider è EN; `I18nProvider` aggiorna `lang` dopo l'idratazione. | Allineare valore iniziale o documentare il comportamento; metadata già EN e dominio `apple-all.vercel.app` |

## Chiavi condivise disponibili

Le chiavi aggiunte in `src/lib/i18n.tsx` per shell, header, tema, pulsanti lingua, 404 e dialog UI (`shell.skip`, `header.*`, `theme.*`, `lang.*`, `notFound.*`, `common.close`) sono già disponibili via `t()`. Per ulteriori chiavi condivise, coordinarsi con l'owner di `src/lib/i18n.tsx` invece di duplicare COPY locale nei componenti di ownership condivisa.
