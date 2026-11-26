# Verifica flussi finali

Generato: 2026-11-26T10:34:07.640Z · Base: http://127.0.0.1:3100 · Lingua: EN · Tema: light

| Verifica | Stato | Evidenza |
| --- | --- | --- |
| Homepage pubblica | PASS | hero, doppia CTA buy/sell e messaggio no-role verificati |
| Registrazione | PASS | 5 campi iniziali, 0 scelte di ruolo |
| Recupero password | PASS | form email presente |
| Dashboard buyer | PASS | KPI e azioni rapide buy/sell presenti |
| Logout | PASS | menu utente e sign out portano a /login |
| Dashboard supplier | PASS | KPI, annunci e azioni rapide presenti |
| Ricerca marketplace | PASS | 12 annunci → 1 con q=rpet |
| Filtro categoria | PASS | Plastics: 5/12 annunci |
| Empty state marketplace | PASS | ricerca senza risultati mostra spiegazione e azioni |
| Pubblicazione attiva | PASS | annuncio LST-2026-4367 attivato dall'UI (status=active) |
| Download preventivo | PASS | preventivo-CL-2026-0139.txt · 443 byte · commissione presente |
| Trasporto, processing e transazioni | PASS | timeline, modalità, lavorazione e riepilogo economico verificati |
| Messaggistica | PASS | invio messaggio nel contesto demo verificato |
| Centro notifiche | PASS | menu con collegamento diretto all'ordine |
| Assistente AI | PASS | apertura manuale e chiusura senza auto-open |
| Profilo e impostazioni | PASS | tab presenti e nessun badge di verifica inventato |
| Stato errore | PASS | ordine inesistente mostra messaggio e azione di ritorno |
| Console e HTTP | PASS | 0 errori console/pageerror/HTTP nelle sessioni finali |

## Errori

Nessuno.

Nota: ogni azione è stata eseguita in un contesto browser isolato; lo stato mutato resta nel localStorage del test. Nessuna chiamata a produzione, pagamento o invio email reale.
