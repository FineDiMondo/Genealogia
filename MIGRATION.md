# Migration Guide: Legacy Pipeline -> Unified Pipeline

## Overview

Il repository adotta una pipeline unificata:

1. `genealogy/gedcom/merged/*.ged` (sync GEDCOM)
2. `GIARDINA/02_DATA/RECORDS/current.ged` (ingest)
3. `GIARDINA/03_PROG/batch.py` (validate + build)
4. `out/current/` (release corrente)
5. `jobs/90_publish_to_pwa.sh` -> `app/public/data/current/`
6. `app/` Astro PWA -> `app/dist/`

## Deprecated Components

Le seguenti directory sono marcate deprecate e non vanno usate per nuove feature:

- `src/portale_giardina.DEPRECATED/`
- `03_records.DEPRECATED/`
- `04_site.DEPRECATED/`
- `01_raw.DEPRECATED/`
- `02_curated.DEPRECATED/`

## Local Workflow

```bash
bash jobs/run_job.sh
cd app
npm ci || npm install
npm run build
```

## Branching

- `main`: production (deploy Pages)
- `develop`: integrazione
- `feature/*`: sviluppo incrementale con PR verso `develop`

