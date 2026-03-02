# Release Notes - GN370 ZIP-first

## Data
2026-03-02

## Novità
- Boot GN370 reso deterministicamente pulito:
  - niente BOOT_LOADER,
  - niente open/validate/scan/parse automatici.
- Introduzione `Memory.reset()` hard con stato DB iniziale EMPTY.
- Nuova HOME import con:
  - scelta archivio ZIP,
  - filtro file per nome,
  - selezione multipla entry,
  - pulsante IMPORTA.
- Gate DB su comandi record e job di parsing.
- Nuovo comando `commit` e alias `job run COMMIT_DB`:
  - export tabelle,
  - ZIP timestamp `YYYYMMDDHHMM.zip`.
- Inclusa dipendenza JSZip locale in `assets/vendor/jszip.min.js`.

## Impatti
- Nessuna dipendenza backend.
- Nessuna modifica a percorsi dati preesistenti al boot.
