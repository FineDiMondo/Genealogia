# ANALISI TECNICA GN370 v2.0

## Stack
- HTML/CSS/JS vanilla IIFE
- JSZip locale
- Copybook COBOL + DDL SQL
- Shell script per CI e setup env

## Invarianti runtime
- I1: boot senza fetch dati.
- I2: status iniziale EMPTY.
- I3: ctx.openedRecord null.
- I5: gate query/fetch con exitCode=2.
- I6: filename commit regex ^\\d{12}\\.zip$.

## Moduli JS
- state.js: state machine.
- db.js: gate/query/import/export.
- outer.js: dispatch comandi shell.
- ender.js: terminale + UI import.
