# Backup e rollback — Offcut 2.0 → 2.1 polish

Documento aggiornato prima di qualsiasi modifica della Fase 2. Nessuna credenziale, chiave API o valore di environment variable è registrato qui.

## Stato protetto

- Data UTC: `2026-11-26T11:50:56Z`
- Working tree prima dell'intervento: pulito (`git status --porcelain` vuoto).
- Commit sorgente locale di Offcut 2.0: `0b96cc314e2115f086fc5a5774ef3314e4afe2d9` (`docs: add Master Prompt compliance matrix and rollback details`).
- Commit distribuito nella produzione attuale: `72aa750f9a641a8fb97871dc0419141491a4be29` (`chore: sync Offcut 2.0 redesign to review branch (12/12)`), tree testuale allineato al commit locale.
- Branch locale prima dell'intervento: `main` e `feature/offcut-2.0`, entrambi su `0b96cc3`. `origin/main` resta `a3de235` e non è stato modificato.

## Ref creati

| Tipo | Nome | Destinazione |
| --- | --- | --- |
| Tag annotato | `offcut-v2.0-before-polish` | commit `0b96cc3` (oggetto tag `04b1b7f726dd5acd576a7ea6477fcb68ba42f5a7`) |
| Branch | `backup/offcut-v2.0` | commit `0b96cc3` |
| Branch di sviluppo | `feature/offcut-v2.1-polish` | commit `0b96cc3` |

Ref di backup preesistenti, **non sovrascritti**: `backup/pre-dark-green`, `backup/pre-premium-redesign`, `offcut-original-pre-redesign`, `backup/offcut-original`.

## Backup completo del codice

Directory: `/root/offcut-backups/offcut-v2.1-polish-20261126T115056Z/`

- `offcut-all-refs.bundle` — bundle Git con tutti i ref e la storia completa; verificato con `git bundle verify`: `bundle is okay`, `records a complete history`.
- `offcut-source.tar.gz` — sorgente completa esclusi `.git`, `node_modules`, `.next` e cache di build.
- `SHA256SUMS` — checksum dei due artifact.

Il bundle contiene anche i ref dei worktree locali; il ripristino del solo prodotto può essere fatto anche dal tag o dal branch di backup senza dipendere dall'archivio.

## Deployment Vercel

- Progetto: `apple-all` (`prj_1nMlKsBImhJKstPUtnWfRODNyChB`), team `team_O5VJKXJ6KTj3B9B3NcXhtEDr`.
- Deployment attivo: `dpl_CNHfPhi6MSzPZ8jJ51KVS7UoN2xX`, target `production`, stato `READY`, commit `72aa750`.
- URL pubblico: https://apple-all-andrea-grecos-projects.vercel.app
- URL diretto: https://apple-jtgmbn067-andrea-grecos-projects.vercel.app
- Candidati di rollback Vercel (`isRollbackCandidate: true`): `dpl_Hd6Ce3N3aX8m2jZxigWbMRgmVYEg` (pre-redesign, commit `a3de235`) e il deployment attivo.
- Nessun deploy di produzione e nessun push su `main` saranno eseguiti in questa fase senza approvazione esplicita. L'ambiente di lavoro è il branch `feature/offcut-v2.1-polish`; se autorizzata, la preview resta separata dalla produzione.
- Nota storica: `https://apple-all.vercel.app` era `404 DEPLOYMENT_NOT_FOUND`; il ripristino va verificato prima di usare quell'alias.

## Database Supabase

- Nel progetto Vercel risultano configurate le sole variabili pubbliche/anon e le chiavi server necessarie; **nessuna chiave `service_role`** è stata trovata o registrata. I valori non sono stati copiati in questo documento.
- Non risulta connessione Supabase integrata nel progetto Vercel, non è installata la CLI `supabase` e non esiste alcun dump `.sql` di backup nel repository o nelle posizioni controllate.
- Di conseguenza: **backup del database non verificato e non eseguito in questa sessione**. Non saranno applicate migrazioni, modifiche a schema/RLS/storage né scritture dirette ai dati durante il polish.
- Se in futuro sarà necessario toccare il database, prima occorre esportare schema e dati con accesso Supabase autorizzato e verificare il ripristino in ambiente isolato. Finché non avviene, il rollback del database non può essere garantito e la parte commerciale resta browser-only/dimo come nello stato attuale.

## Procedura di rollback

### Codice

```bash
cd /root/apple-all
git fetch origin
git switch main
git reset --hard 0b96cc314e2115f086fc5a5774ef3314e4afe2d9
```

Oppure, per tornare allo stato di sviluppo precedente:

```bash
git switch backup/offcut-v2.0
```

Non usare `git push --force` su `main`. Se il ripristino remoto sarà esplicitamente autorizzato, creare un commit di revert o usare GitHub MCP sull'endpoint autorizzato.

### Bundle offline

```bash
git clone /root/offcut-backups/offcut-v2.1-polish-20261126T115056Z/offcut-all-refs.bundle /tmp/offcut-restore
cd /tmp/offcut-restore
git checkout offcut-v2.0-before-polish
```

### Preview / produzione Vercel

- Annullare una preview: rimuovere/disattivare il deployment della preview; la produzione resta `dpl_CNHfPhi6MSzPZ8jJ51KVS7UoN2xX`.
- Ripristino della produzione solo dopo approvazione esplicita: promuovere uno dei deployment candidati tramite Vercel MCP/CLI e verificare l'URL pubblico con una richiesta anonima.
- Non promuovere `main` remoto: contiene ancora `a3de235`, cioè lo stato pre-redesign.

## Vincoli da preservare

- Modello commerciale, commissioni, prezzi, trasporto, processamento, logiche di calcolo e processi esistenti invariati.
- Nessun abbonamento, paywall, nuovo servizio a pagamento o funzione aggiunta solo per sembrare più ricca.
- Onboarding in due passi, sola Bologna, nessuna scelta buyer/seller, acquisto e vendita entrambi attivi, condizioni multi-select, upload foto, ricorrenza settimanale, data di consegna scelta dall'acquirente, preventivi scaricabili e modalità trasporto ordine.
- Italiano/inglese, light/dark mode, account demo, assistente AI e funzioni vocali, logo e identità Offcut.
- Solo domini `vercel.app`; nessun dominio custom, DNS o acquisto domini.
