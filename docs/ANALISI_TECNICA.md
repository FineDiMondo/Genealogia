# ANALISI TECNICA GN370 - Versione 0

## Stack

- Frontend: HTML/CSS/JavaScript (IIFE, no framework)
- Runtime shell: router + renderer terminale
- Storage: motore DB in memoria + runtime SQL browser-side
- Import: parser GEDCOM + import adapter (CSV/XML/JSON)
- Utility: JSZip, script Python/Bash per build e verifica

## Architettura moduli (assets/js)

- `boot.js`: bootstrap e reset deterministico
- `state.js`: stato globale runtime
- `db.js`: gate, query, import/export, reset
- `router.js`: dispatch comandi shell
- `render.js`: output terminale e UI picker
- `validate.js`: controlli consistenza
- `journal.js`: log append-only
- `sql-runtime.js`: adattatore SQLite WASM/OPFS/fallback
- `maps.js`: mappe ASCII legacy + prototipo 9 mondi + guard warning

## Pipeline GEDCOM

- S1 `gedcom-tokenizer.js`
- S2 `gedcom-mapper.js`
- S3 `norm-agent.js`
- S3.5 `family-log-agent.js` (profilazione famiglia + normalizzazione AI-assisted da storico)
- S4 `conflict-detect.js`
- S5 `conflict-ui.js`
- S6 `db-writer.js`
- S7 `batch-agt-ic.js`, `batch-agt-norm2.js`, `batch-agt-corr.js`
- orchestratore: `gedcom.js`

## Persistenza log import

- `IMPORT_LOG`: log per-record pipeline.
- `IMPORT_LOG_FAMILY`: log per-record partizionato per `family_key`, riusato come base di normalizzazione nei successivi import.
- mirror SQL dedicato: `GN370_IMPORT_FAMILY_LOG` (PK composta `family_key + log_ts + pipeline_id`).

## Regole di integrita V0

- gate bloccante su query/fetch quando DB non READY
- reset idempotente
- naming export conforme al timestamp previsto
- routing comandi senza side-effect impliciti in boot
