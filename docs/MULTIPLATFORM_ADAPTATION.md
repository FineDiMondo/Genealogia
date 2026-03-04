# GN370 - Piano multipiattaforma (V0)

## Obiettivo V0

Consolidare una base multipiattaforma orientata a build ripetibili e DB embedded.

## Stato corrente

- schema SQL centralizzato: `db/schema.sql`
- runtime SQL browser-side: `assets/js/sql-runtime.js`
- bootstrap SQL in boot: `assets/js/boot.js`
- script utilita:
  - `scripts/recreate_sqlite.py`
  - `scripts/build-all.py`
  - `scripts/build-all.sh`
  - `scripts/vendorize-sqlite-wasm.js`
- CI multipiattaforma presente: `.github/workflows/build-multiplatform.yml`

## Target dichiarati

- Windows
- macOS
- Linux
- Android

## Vincoli V0

- priorita alla stabilita della pipeline dati
- fallback operativo se runtime SQL nativo non disponibile
- mantenimento delle invarianti di boot e gate

## Step successivi (post-V0)

1. Consolidare mapping typed tabelle core (oltre row-store)
2. Aumentare copertura test su parity memoria/SQL
3. Raffinare packaging nativo target-specific

## Avanzamento post-V0

- 2026-03-04: step 1 completato.
  - aggiunte tabelle mirror typed core in `db/schema.sql`:
    - `GN370_PERSON`
    - `GN370_FAMILY`
    - `GN370_PLACE`
    - `GN370_SOURCE`
    - `GN370_EVENT`
    - `GN370_CITATION`
    - `GN370_IMPORT_FAMILY_LOG`
  - `assets/js/sql-runtime.js` ora sincronizza sia `GN370_ROW_STORE` sia mirror typed.
  - mantenuto invariato il comportamento deterministico di reset/boot e il row-store come fallback canonico.

- 2026-03-04: step 2 completato.
  - aggiunto test runtime parity memoria/SQL: `tests/sql_runtime_parity.test.js`.
  - lo script `npm run test:sql` ora esegue:
    - `tests/sql_runtime.test.js` (wiring/static checks)
    - `tests/sql_runtime_parity.test.js` (parity `table_meta`/`typed_meta` + `import_audit` + reset SQL)
