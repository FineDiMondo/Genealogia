# ANALISI FUNZIONALE GN370 - Versione 0

## Sottosistemi utente

- Shell comandi
- Home import e import pipeline
- Consultazione record
- Visualizzazioni tree/map/timeline
- Mappe ASCII e prototipo mondo-sequenza (`proto`)
- Validazione e monitor

## Flussi primari

### Flusso A - Boot e readiness
1. Avvio applicazione
2. Reset stato runtime
3. UI pronta in `DB: EMPTY`
4. Attesa comando utente

### Flusso B - Import DB archivio
1. `db import`
2. Selezione ZIP da picker
3. Selezione entry
4. Import e switch a `DB: READY`

### Flusso C - Import GEDCOM
1. `import gedcom [opzioni]`
2. Esecuzione S1..S7 con normalizzazione assistita da profili famiglia (`IMPORT_LOG_FAMILY`)
3. Consultazione `import status/log/conflicts` (supporto filtro `import log --family <family_key>`)
4. Eventuale `import review/accept`

### Flusso D - Analisi e controllo
1. `open`/`find`/`tree`/`timeline`/`map`
2. `validate`
3. `monitor`
4. `db export`

## Flusso E - Mappe e prototipo

- Legacy: `maps`, `mappa 1a`, `map 2d`
- Prototipo V0: `proto home`, `proto world 1 seq`, `proto lint all`
- Guard warning: segnala output verboso, duplicato o non conforme
