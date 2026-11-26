# Revisioni visive Offcut 2.1

Metodo: catture Playwright/Chromium headless su 14 viste (public, app, buyer e supplier, IT/EN, light/dark, mobile/tablet/desktop) e metriche DOM su 8 viewport. Confronto affiancato: [CONTACT_SHEET.html](/root/apple-all/qa/audit-v2.1/after/visual-review/CONTACT_SHEET.html).

**Limite dichiarato:** il modello corrente non supporta l'analisi visiva diretta dei PNG (`read` restituisce errore per immagini). Le valutazioni seguenti sono quindi critiche sui dati misurabili (altezza sezioni, overflow, target, conteggio H2, coerenza testi e stato HTTP), non su una visione umana delle immagini. Le immagini prima/dopo sono state comunque generate e sono disponibili per la revisione dell'utente.

## Revisione 1 — ritmo verticale globale

Intervento: compattazione di padding e tipografia in `landing.module.css` senza rimuovere alcuna sezione o informazione: `.section`, hero, titoli, lead, pannelli, step, elenchi, preview, FAQ, CTA finale e footer.

Metriche (altezza home):

| Viewport | Prima | Dopo R1 | Δ |
| --- | ---: | ---: | ---: |
| 390 | 14399 | 12269 | −14,8% |
| 1440 | 10275 | 7961 | −22,5% |

Valutazione critica: il risultato desktop è già in intervallo; il mobile resta sotto l'obiettivo indicativo del 20%. Le sezioni più alte restano hero strip, step e materiali. Nessun overflow orizzontale e tutte le 13 sezioni sono presenti.

Screenshot disponibili: [prima mobile](/root/apple-all/qa/audit-v2.1/before/visual-review/home-mobile-light-it.png) · [prima desktop](/root/apple-all/qa/audit-v2.1/before/visual-review/home-desktop-light-en.png). Le misure intermediate R1 sono in `review1/metrics.json`; lo screenshot "dopo" finale è della revisione 3.

## Revisione 2 — densità mobile

Intervento: hero strip a 3 colonne, step a 2 colonne, righe materiali con miniatura, righe risultati più compatte, riduzione spazi FAQ. Contenuti invariati.

Metriche (altezza home):

| Viewport | Prima | Dopo R2 | Δ cumulato |
| --- | ---: | ---: | ---: |
| 390 | 14399 | 11595 | −19,5% |
| 1440 | 10275 | 7961 | −22,5% |

Valutazione critica: il mobile si avvicina alla soglia; resta elevato il pannello filtri marketplace nella homepage. Nessuna perdita di H2 (11) e nessun overflow. La densità resta leggibile perché la compattazione riguarda spaziature e griglie, non dimensioni dei testi principali.

Screenshot disponibili: [prima mobile](/root/apple-all/qa/audit-v2.1/before/visual-review/home-mobile-light-it.png) · [prima marketplace tablet](/root/apple-all/qa/audit-v2.1/before/visual-review/marketplace-tablet-light-en.png). Le misure intermediate R2 sono in `review2/metrics.json`; lo screenshot "dopo" finale è della revisione 3.

## Revisione 3 — rifinitura finale

Intervento: filtri homepage su due colonne in mobile e ulteriore riduzione di padding mobile per sezioni, hero, CTA finale e footer. Nessun testo rimosso.

Metriche finali (altezza home):

| Viewport | Prima | Finale | Δ |
| --- | ---: | ---: | ---: |
| 360 | 14724 | 11770 | −20,1% |
| 375 | 14590 | 11591 | −20,6% |
| 390 | 14399 | 11363 | −21,1% |
| 430 | 14085 | 11135 | −20,9% |
| 768 | 10107 | 8373 | −17,2% |
| 1024 | 9927 | 7976 | −19,7% |
| 1440 | 10275 | 7961 | −22,5% |
| 1920 | 10322 | 7958 | −22,9% |

Valutazione critica: obiettivo indicativo raggiunto su telefono e desktop; tablet resta volutamente meno compatto per preservare leggibilità e spazio dei pannelli. Risultati finali: 0 overflow orizzontale, 0 target inferiori a 24 px, 11 H2 e 13 sezioni su tutti i viewport misurati. Le modifiche sono limitate a CSS di layout e copy di contatto/localizzazione; non sono stati alterati prezzi, commissione 6%, trasporto, lavorazione o flussi commerciali.

Screenshot finali: [home mobile](/root/apple-all/qa/audit-v2.1/after/visual-review/home-mobile-light-it.png) · [home desktop light](/root/apple-all/qa/audit-v2.1/after/visual-review/home-desktop-light-en.png) · [home desktop dark](/root/apple-all/qa/audit-v2.1/after/visual-review/home-desktop-dark-it.png) · [dashboard](/root/apple-all/qa/audit-v2.1/after/visual-review/dashboard-desktop-light-it.png) · [marketplace mobile](/root/apple-all/qa/audit-v2.1/after/visual-review/marketplace-mobile-dark-it.png).
