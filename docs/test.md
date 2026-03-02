# Test Plan - GN370 ZIP-first

## Test T1 Boot clean
- Aprire `index.html` / Pages.
- Verificare HOME import visibile.
- Verificare stato: `DB: EMPTY` e `MEM: CLEAN`.
- Verificare Network: nessuna richiesta a `/data/current/...` al boot.

## Test T2 Import ZIP selettivo
- Preparare ZIP con:
  - `tables/PERSON.table`
  - `tables/EVENT.table`
- Selezionare ZIP, filtrare per `PERSON`.
- Selezionare solo `tables/PERSON.table`.
- Premere IMPORTA.
- Atteso: DB READY, 1 tabella caricata.

## Test T3 Gate DB
- Eseguire `refresh` (reset).
- Eseguire `open rec PERSON P#001`.
- Atteso: messaggio "DB non caricato. Importa ZIP." e nessun fetch record.

## Test T4 Commit DB
- Dopo import valido, eseguire `commit`.
- Atteso: download file `<AAAAMMGGHHMM>.zip`.
- Verificare contenuto: un file per tabella in `tables/`.

## Test T5 Alias job
- Eseguire `job run COMMIT_DB`.
- Atteso: stesso risultato del comando `commit`.
