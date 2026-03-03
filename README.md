# GN370 v2.0

Shell genealogica statica COBOL-first, CICS-like, conforme a `GN370_Blueprint_v2.0`.

## Avvio locale

1. `npm install`
2. `python -m http.server 8080`
3. Apri `http://localhost:8080`

## Comandi principali shell

- `help`
- `status`
- `db import`
- `db list`
- `db export`
- `import gedcom`
- `import herald`
- `validate`
- `monitor db`
- `theme normanno`

## Pipeline GEDCOM (S1-S7)

- `import gedcom`
- `import gedcom --dry-run`
- `import gedcom --auto-skip-low`
- `import gedcom --strict`
- `import status`
- `import log --n 20`
- `import log --record <pipeline_id>`
- `import conflicts`
- `import review <corr_id>`
- `import accept <corr_id>`
- `import batch rerun`

## Test e verifiche

- `bash scripts/verify_deployment.sh`
- `bash scripts/verify_boot.sh`
- `bash scripts/static_analysis.sh`
- `bash scripts/check_copybooks.sh`
- `node tests/gate_tests.js`
- `bash tests/multienv_tests.sh`
- `npx playwright test`

## Multi-environment

- `bash environments/setup-env.sh dev`
- `bash environments/setup-env.sh test`
- `bash environments/setup-env.sh prod`
