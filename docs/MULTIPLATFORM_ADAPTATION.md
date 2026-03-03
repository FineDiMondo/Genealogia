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
