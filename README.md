# GN370 - Versione 0 (baseline)

GN370 e una shell genealogica web "static-first" con boot deterministico e pipeline GEDCOM guidata da utente.

Questa documentazione descrive la **Versione 0**: base funzionante, perimetro chiaro, invarianti tecniche, limiti noti.

## Obiettivo V0

- Rendere ripetibile l'avvio: stato iniziale sempre `DB: EMPTY`.
- Consentire import manuale di dataset genealogici e fonti collegate.
- Fornire shell comandi uniforme per consultazione, controllo e validazione.
- Mantenere deployment statico e runtime client-side.

## Avvio locale

1. `npm install`
2. `npm run vendor:sqlite`
3. `python scripts/serve_with_isolation.py --port 8080`
4. Aprire `http://localhost:8080`
   - se la porta `8080` e occupata, `npm run serve` usa automaticamente la successiva disponibile (es. `8081`)

## Comandi principali shell

- `help`, `man <cmd>`, `status`, `clear`, `quit`
- `db import`, `db list`, `db show <table>`, `db reset`, `db export`
- `import gedcom [--dry-run --auto-skip-low --strict]`
- `import status`, `import log [--n N --record <id> --family <family_key>]`, `import conflicts`, `import review`, `import accept`, `import batch rerun`
- `import herald`, `import notarial`, `import nobility`
- `validate`, `monitor <db|system|herald|env|perf>`
- `maps`, `mappa <n|n[a-d]>`, `proto ...`, `map --period <era>`, `timeline`, `tree`

## Documentazione V0

- [Versione 0 - indice](docs/VERSIONE_0.md)
- [Analisi requisiti](docs/ANALISI_REQUISITI.md)
- [Analisi tecnica](docs/ANALISI_TECNICA.md)
- [Analisi funzionale](docs/ANALISI_FUNZIONALE.md)
- [Analisi funzionale GNHM0001 (home gateway)](docs/ANALISI_FUNZIONALE_GNHM0001.md)
- [Analisi tecnica GNHM0001 (home gateway)](docs/ANALISI_TECNICA_GNHM0001.md)
- [GEDCOM mapping](docs/GEDCOM_MAPPING.md)
- [Herald format](docs/HERALD_FORMAT.md)
- [Lessico](docs/LEXICON.md)
- [Piano multipiattaforma](docs/MULTIPLATFORM_ADAPTATION.md)

## Test minimi V0

- `node tests/gate_tests.js`
- `node tests/multienv_tests.js`
- `node tests/sql_runtime.test.js`

## Note importanti

- Il materiale in `docs/progetto_riferimento/` e trattato come snapshot di riferimento, non come documentazione operativa V0.
- V0 privilegia stabilita operativa e tracciabilita; non e una release feature-complete.
