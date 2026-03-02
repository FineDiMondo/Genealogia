# Genealogia Giardina Negrini

Repository in stile COBOL su UNIX:

- base dati in file sequenziali `.DAT`
- tracciati in `copy/*.CPY`
- job in `proc/`
- output statico in `PORTALE_GN/`

## Unified Pipeline Architecture

Pipeline target:

1. `genealogy/gedcom/merged/*.ged`
2. `GIARDINA/02_DATA/RECORDS/current.ged`
3. `GIARDINA/03_PROG/batch.py` (`validate`, `build`)
4. `out/current/`
5. `jobs/90_publish_to_pwa.sh`
6. `app/public/data/current/`
7. Astro PWA (`app/`) -> `app/dist/`

## Branch Strategy

- `main`: production release + deploy Pages (`pages-astro.yml`)
- `develop`: integrazione/test (`build-test.yml`)
- `feature/*`: sviluppo con PR verso `develop`

## Quick Start (Unified)

```bash
bash jobs/run_job.sh
cd app
npm ci || npm install
npm run build
```

Documenti correlati:

- `MIGRATION.md`
- `CONTRIBUTING.md`

## Monorepo Pattern 1 (jobs + out + app)

Struttura operativa introdotta:

- `jobs/` batch shell COBOL-like (filesystem only)
- `data/raw`, `data/inbox`, `data/work`
- `out/staging`, `out/releases`, `out/current`
- `control/lock` lock run concorrenti
- `logs/<build_id>/*.log` log step-by-step
- `app/` Astro static + PWA (nessun backend, nessuna logica agentica)

Pipeline atomica:

1. build in `out/staging/<build_id>`
2. validate staging
3. promote in `out/releases/<version>`
4. update `out/current` (copy)
5. publish in `app/public/data/current`

La PWA legge solo file statici da `/data/current/**`.

### Comandi locali (nuovo flusso)

```bash
bash jobs/run_job.sh
cd app
npm install
npm run dev
```

Build produzione:

```bash
bash jobs/run_job.sh
cd app
npm install
npm run build
npm run preview
```

## Portale Giardina (pipeline YAML)

Il repository mantiene il flusso COBOL/DAT esistente e aggiunge una pipeline parallela idempotente per il nuovo Portale Giardina:

- `01_raw/` ingestione file grezzi (upload mobile/desktop)
- `02_curated/` media rinominati in naming canonico
- `03_records/` record YAML versionabili
- `04_site/` sito statico generato (timeline + indici)
- `src/portale_giardina/` validate/build/ingest

Scelta architetturale: separare pipeline nuova e storica evita regressioni su `PORTALE_GN/` e consente migrazione incrementale.

## Link Portali

- Portale Chiaro: `PORTALE_GN/portale-chiaro.html`
- Portale 370: `PORTALE_GN/portale-370.html`
- Selettore rapido (home): `PORTALE_GN/index.html`

## Struttura Progetto

```text
.github/          workflow GitHub Pages
copy/             specifiche tracciati record (CPY)
data/             file sequenziali DAT e import
docs/             documentazione operativa
logs/             log run (runtime, non versionati)
out/              report build/validate (runtime, non versionati)
PORTALE_GN/       sito statico e entrypoint portali
proc/             script job (sh + ps1)
src/              utility e supporto
```

## Comandi Principali

### Portale Giardina (nuovo flusso)

Prerequisiti:

```bash
python -m pip install -r requirements-dev.txt
```

Comandi:

```bash
make validate
make build
```

Coda acquisizione media:

```bash
python -m src.portale_giardina.pipeline ingest --record-id "YYYY-MM-DD__tipo__soggetti__luogo__slug" --with-hash
```

### Setup Bash su Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\proc\setup_bash_windows.ps1
```

Se il setup va a buon fine:

- `bash` viene aggiunto al `PATH` utente (persistente)
- la sessione corrente viene aggiornata
- conviene riaprire il terminale per persistenza completa

### Tabella rapida

| Ambiente | Comandi consigliati |
|---|---|
| Linux/macOS | `./proc/validate_data.sh` / `./proc/build_portale.sh` |
| Windows PowerShell | `.\proc\run_validate.ps1` / `.\proc\run_build.ps1` |
| Windows CMD | `.\proc\run_validate.cmd` / `.\proc\run_build.cmd` |

Linux/macOS (bash):

```bash
./proc/validate_data.sh
./proc/build_portale.sh
```

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File .\proc\import_rmtree.ps1 .\data\GEDCOM-FT-20260301.rmtree
powershell -ExecutionPolicy Bypass -File .\proc\validate_data.ps1
powershell -ExecutionPolicy Bypass -File .\proc\build_portale.ps1
```

Windows (launcher cross-platform):

```powershell
.\proc\run_import_gedcom.ps1
.\proc\run_validate.ps1
.\proc\run_build.ps1
.\proc\run_download_heraldry_vectors.ps1
```

## Naming Canonico

- ID record: `YYYY-MM-DD__tipo__soggetti__luogo__slug`
- Media: stesso prefisso del record + `__scanNNN.ext`
- Esempio:
  - record: `1738-04-11__stemma__giardina__palermo__documentato`
  - media: `1738-04-11__stemma__giardina__palermo__documentato__scan001.svg`

## Metodo Attendibilità

- `DOCUMENTATO`: atto o fonte primaria verificata
- `STAMPA`: fonte a stampa storica
- `ATTRIBUITO`: tradizione o attribuzione secondaria
- `RICOSTRUITO`: elaborazione grafica/metodologica
- `TRADIZIONE`: menzione non verificata

Dettagli operativi: `docs/METODO_PORTALE_GIARDINA.md`.

## MIGRAZIONE

1. Continuare a usare pipeline COBOL (`proc/*.sh|ps1`) per `PORTALE_GN`.
2. Inserire nuovi contenuti nel flusso YAML (`03_records/*.yml`).
3. Validare con `make validate` e correggere errori link/schema.
4. Generare `04_site/` con `make build`.
5. Quando stabile, valutare switch deploy verso `04_site` o integrazione in `PORTALE_GN/generated`.

## Perimetro GIARDINA (COBOL COPY rigoroso)

E' stato aggiunto un perimetro dedicato `GIARDINA/` con separazione `COPY/DATA/PROG/JCL/OUT/TEST`.

Comandi rapidi:

```bash
python GIARDINA/03_PROG/batch.py validate
python GIARDINA/03_PROG/batch.py build
python GIARDINA/03_PROG/batch.py all
```

Documentazione:

- `GIARDINA/00_DOCS/ASSESSMENT_REPORT.md`
- `GIARDINA/00_DOCS/TARGET_ARCHITECTURE_AND_MIGRATION.md`
- `GIARDINA/00_DOCS/STANDARD_COPY.md`

## GEDCOM Sync Orchestrator

Per sincronizzazione GEDCOM giornaliera con commit Git e notifiche email:

- guida operativa: `README_GEDCOM_SYNC.md`
- script principale: `gedcom_sync_orchestrator.py`
- setup rapido: `setup.sh`
