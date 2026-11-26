# Verifica flussi annunci

Generato: 2026-11-26T10:43:09.277Z · Base: http://127.0.0.1:3100

| Verifica | Stato | Evidenza |
| --- | --- | --- |
| Prefill modifica IT | PASS | Ritagli OCC kraft 90/10; editingId=lst_occ; campi chiave allineati |
| Salvataggio modifica IT | PASS | titolo aggiornato; riferimento=LST-2026-0401; stato=active; org=org_greenloop |
| Persistenza dopo refresh | PASS | Ritagli OCC kraft 90/10 — QA; riferimento invariato |
| Prefill duplicazione EN | PASS | Ritagli OCC kraft 90/10 (copy); editingId assente |
| Duplicazione salvata EN | PASS | id=lst_e9c7fc09; riferimento=LST-2026-7175; stato=draft |

## Errori

Nessuno.

Nota: stato e scritture sono confinati al localStorage del contesto di test; nessuna modifica al server o alla produzione.
