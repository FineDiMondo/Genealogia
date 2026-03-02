# Technical Notes - GN370 ZIP-first

## Moduli toccati
- `index.html`: include `assets/vendor/jszip.min.js`.
- `assets/gn370.js`:
  - `Memory.reset()` unificato.
  - Boot pulito (`boot()`): reset + render HOME import.
  - `renderHomeImport()` + `bindHomeImportUi()`.
  - `importZip(file, selectedEntries)`.
  - `commitDb()` + `nowYYYYMMDDHHMM()`.
  - Gate `requireDbReady()` su comandi record/validate/job.

## Modello memoria
- `state.db = { status, tables, indexes, meta }`
- `state.ctx`, `state.cache`, `state.jobsQueue`, `state.feed`, `state.errors`
- `Memory.reset()` azzera runtime e storage di sessione GN370.

## Import ZIP
- Parsing ZIP tramite JSZip client-side.
- Nome tabella derivato da basename entry senza estensione e upper-case.
- Tabella conservata in formato `{ raw: <testo> }`.
- Nessun backend richiesto.

## Commit ZIP
- Serializzazione tabella:
  - usa `table.raw` se presente,
  - fallback JSON stringify.
- Struttura output ZIP: `tables/*.table`.
- File nome timestamp: 12 cifre `YYYYMMDDHHMM`.
