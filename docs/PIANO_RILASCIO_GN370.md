# Piano Rilascio GN370

## Obiettivo
Rilasciare incrementi piccoli, tracciabili, con gate e smoke su Pages (static 370).

## Branching
- feature branches -> PR -> main
- gate per fase (es: Gate 5a, Gate 5b, ecc.)

## Versioning
- BUILD stamp = commit short + data (o `version.json`)
- Dataset version = hash o timestamp di `data/current`

## Pipeline rilascio
1) Merge su main
2) CI test Python
3) Deploy Pages static 370 (`pages-static.yml`)
4) Smoke check (`verify_deployment.sh`)
5) Annotazione in changelog/release note

## Checklist rilascio
- Tutti i test in verde
- Pages pubblica static 370
- Nessun workflow attivo invoca npm
- Docs aggiornati:
  - ANALISI_FUNZIONALE
  - ANALISI_TECNICA
  - PIANO_TEST
  - PIANO_RILASCIO

## Rollback
- Revert commit su main
- Redeploy Pages
- Verifica smoke

## Evidenze da archiviare
- link alla run Actions
- output smoke
- commit hash
- note di rilascio sintetiche
