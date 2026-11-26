# Rollback point — premium redesign (Fase 0)

Stato bloccato prima di qualunque modifica del brief **OFFCUT 2.0 — Premium B2B Website & Platform Redesign**.

- Commit: `a3de23564eb7c296f296d87af71d6cb72a186b63` (`Add team names and roles to About page`)
- Branch di backup remota: `backup/pre-premium-redesign`
- Tag locali: `backup/pre-dark-green` (precedente), `backup/pre-premium-redesign`, `offcut-original-pre-redesign` (questo punto)
- Branch locali: `backup/offcut-original` sul backup, `feature/offcut-2.0` sullo sviluppo
- Deployment Vercel production registrato: `dpl_Hd6Ce3N3aX8m2jZxigWbMRgmVYEg` — https://apple-all.vercel.app
- Stato osservato il 26 novembre 2026: l'URL pubblico risponde `404 DEPLOYMENT_NOT_FOUND` (evidenza `qa/logs/production-availability.log`); il ripristino va verificato con Vercel MCP prima di ogni promozione.
- Nessun deploy in produzione senza approvazione esplicita dell'utente.
- Database, schema, RLS e storage: backup non verificato in questa sessione; occorre eseguirlo manualmente con `supabase db dump`/export storage e conservarlo fuori dal repository prima di qualsiasi migrazione.

## Ripristino del codice

```bash
cd /root/apple-all
git fetch origin
git reset --hard a3de23564eb7c296f296d87af71d6cb72a186b63
git push --force-with-lease origin main
```

Se il push con CLI Git non è autenticato, usare GitHub MCP `push_files` sullo SHA del commit di backup oppure creare un nuovo commit di revert su `main`.

## Ripristino della produzione Vercel

Metodo consigliato (nessun rebuild): promuovere il deployment `dpl_Hd6Ce3N3aX8m2jZxigWbMRgmVYEg` alla produzione tramite Vercel MCP/CLI:

```bash
vercel promote dpl_Hd6Ce3N3aX8m2jZxigWbMRgmVYEg --scope <scope> --yes
```

Verifica finale: https://apple-all.vercel.app deve rispondere con il commit `a3de235` e mantenere logo CA, palette verde scuro, nav EN/IT e ruoli team già approvati.

## Vincoli da preservare durante il redesign

- Palette dark-green già spedita; non tornare al blu.
- Nessuna sovrapposizione dei menu superiori; 8 link sempre raggiungibili anche su mobile.
- Traduzione EN/IT completa in tutte le schede.
- Logo fornito (`offcut-mark.svg`, `offcut-logo.svg`, favicon, apple icon).
- Team: Linda Battaglia CEO, Andrea Greco CTO & COO, Dario Felice CFO.
- Onboarding in due passi, solo Bologna, nessuna scelta buyer/seller, buy e sell entrambi attivi, form brevi, condizioni multi-select, upload foto venditore, select allineate, ricorrenza settimanale, data consegna scelta dall'acquirente, chatbot, download preventivo, trasporto ordine.
- Solo dominio `vercel.app`; nessun dominio custom.
