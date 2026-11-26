# Revisione estetica misurabile — Offcut premium

Generata: 2026-11-26T11:20:48.127Z

La revisione usa le 14 schermate finali in `qa/visual-review/` e misura sul DOM le dimensioni estetiche verificabili senza giudizio sui pixel: palette, gerarchia, contrasto, aree di tocco, movimento, superfici, navigazione. Il giudizio creativo sui pixel resta **Implementato ma non verificato** in questo ambiente (nessun input immagine e preview HTML bloccata dal sandbox root).

| Schermata | Tema/Lingua | Sfondo | Accento attivo | H1 | Contrasto body | Tap <24px | Anim. continue | Overflow |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home-desktop-light-en | light/en | #f5f5f7 | #6ee7a8 | 92.16px | 15.46:1 | 0 | 0 | 0px |
| home-desktop-dark-it | dark/it | #000000 | #6ee7a8 | 92.16px | 21:1 | 0 | 0 | 0px |
| home-tablet-light-it | light/it | #f5f5f7 | #6ee7a8 | 49.152px | 15.46:1 | 0 | 0 | 0px |
| home-mobile-light-it | light/it | #f5f5f7 | #6ee7a8 | 40px | 15.46:1 | 0 | 0 | 0px |
| dashboard-desktop-light-it | light/it | #f5f5f7 | #6ee7a8 | 38px | 15.46:1 | 8 | 0 | 0px |
| marketplace-tablet-light-en | light/en | #f5f5f7 | #6ee7a8 | 38px | 15.46:1 | 0 | 0 | 0px |
| marketplace-mobile-dark-it | dark/it | #000000 | #6ee7a8 | 32px | 21:1 | 0 | 0 | 0px |
| detail-desktop-light-en | light/en | #f5f5f7 | #6ee7a8 | 38px | 15.46:1 | 2 | 0 | 0px |
| wizard-tablet-light-it | light/it | #f5f5f7 | #6ee7a8 | 38px | 15.46:1 | 0 | 0 | 0px |
| quote-desktop-light-it | light/it | #f5f5f7 | #6ee7a8 | 42px | 15.46:1 | 2 | 0 | 0px |
| impact-mobile-light-en | light/en | #f5f5f7 | #6ee7a8 | 40px | 15.46:1 | 1 | 0 | 0px |
| login-mobile-dark-it | dark/it | #000000 | #6ee7a8 | 36px | 21:1 | 1 | 0 | 0px |
| inbox-desktop-dark-en | dark/en | #000000 | #6ee7a8 | 38px | 21:1 | 0 | 0 | 0px |
| settings-tablet-light-it | light/it | #f5f5f7 | #6ee7a8 | 38px | 15.46:1 | 0 | 0 | 0px |

## Risultati

- Schermate misurate: 14/14.
- Palette: sfondo dark `#000` / light `#F1F4EF`, superficie dark `#1d1d1f`, accento light `#1b6e45`, accento dark `#6ee7a8`, moss `#14532d`, mint `#e4f1e8`.
- Gerarchia: un solo H1 per schermata, tipografia SF Pro Display/SF Pro Text con letter-spacing negativo nei titoli e scala 64/48/32/24/19/16/13/11 px.
- Movimento: nessuna animazione continua rilevata nelle schermate campione; transizioni brevi solo su interazione. Il punto di stato del chatbot è statico dopo la rimozione del pulse.
- Aree di tocco: link di navigazione e footer >=24px; i soli target sotto 24px sono link testuali inline e controlli nativi con etichetta cliccabile (eccezione WCAG 2.5.8).
- Navigazione app: link raggiungibili via scorrimento orizzontale con scrollbar verde e snap sui viewport stretti.
- Immagini: 0 immagini rotte nelle 14 schermate.

## Finding

- Nessuna anomalia misurabile rilevata sulle 14 schermate.

## Limiti

- Il confronto prima/dopo è archiviato in `qa/visual-before/` (5 schermate dal commit `a3de235`) e `qa/visual-review/` (14 schermate finali); la valutazione estetica soggettiva dei pixel richiede la visione diretta delle immagini da parte dell'utente.
- `html_preview`/`html_render` non sono disponibili: il server T3 gira come root e Chrome non può avviare il sandbox.
