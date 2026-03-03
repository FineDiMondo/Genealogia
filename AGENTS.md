# GN370 Agents Notes

## GEDCOM Import Pipeline

Pipeline attiva in `assets/js/import/`:
- `gedcom-tokenizer.js` (S1)
- `gedcom-mapper.js` (S2)
- `norm-agent.js` (S3)
- `conflict-detect.js` (S4)
- `conflict-ui.js` (S5)
- `db-writer.js` (S6)
- `batch-agt-ic.js` (S7-IC)
- `batch-agt-norm2.js` (S7-NORM2)
- `batch-agt-corr.js` (S7-CORR)
- `gedcom.js` orchestratore (`GN370.GEDCOM.start(file)`)

## Command Routing

Nuovi comandi shell:
- `import gedcom [--dry-run] [--auto-skip-low] [--strict]`
- `import status`
- `import log [--n N] [--record <id>] [--family <family_key>]`
- `import log --record <id>`
- `import conflicts`
- `import review <corr_id>`
- `import accept <corr_id>`
- `import batch rerun`

## Invarianti

- Boot deterministico invariato: `DB.status=EMPTY`, nessun data fetch automatico.
- Gate fetch inline in `index.html` non modificato.
- Batch agents eseguiti solo post-write.
- Ogni record processato produce entry in `IMPORT_LOG`.
