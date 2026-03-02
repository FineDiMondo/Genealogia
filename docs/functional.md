# Functional Specification - GN370 ZIP-first

## Obiettivo
La shell GN370 avvia sempre in stato pulito, senza caricare record o dataset automatici.

## Regole funzionali
- Boot: nessun autoload, nessun open record, nessun parse/scan automatico.
- Boot: `Memory.reset()` hard e stato iniziale `DB.status = EMPTY`.
- Prima schermata: HOME import con file picker ZIP.
- Import: l'utente seleziona lo ZIP e i file da importare per nome.
- Gate DB: i comandi che lavorano su record (`open`, `validate`, job scan/parse) sono bloccati se DB non READY.
- Commit DB: esporta tutte le tabelle in `tables/<TABLENAME>.table`, crea ZIP e scarica `<AAAAMMGGHHMM>.zip`.

## Flussi utente
1. Apertura shell -> HOME import (DB EMPTY, MEM CLEAN).
2. Selezione ZIP -> filtro per nome file -> selezione checkbox -> IMPORTA.
3. Stato DB diventa READY.
4. Comando `commit` (o `job run COMMIT_DB`) produce download ZIP timestamp.
