# README_COBOL_STYLE

## Filosofia

- Base dati: file sequenziali `.DAT` pipe-delimited (`|`)
- Tracciati: `copy/*.CPY`
- Job batch: `proc/*.sh` (Unix) e `proc/*.ps1` (Windows)
- Output: HTML statico in `PORTALE_GN/`
- Niente JSON come base dati

## Portali

- Portale Chiaro: `PORTALE_GN/portale-chiaro.html`
- Portale 370: `PORTALE_GN/portale-370.html`
- Home selezione: `PORTALE_GN/index.html`

## Input e Import

Input principale:

- `data/GEDCOM-FT-20260301.rmtree`

Import Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\proc\import_rmtree.ps1 .\data\GEDCOM-FT-20260301.rmtree
```

Setup Bash su Windows (consigliato):

```powershell
powershell -ExecutionPolicy Bypass -File .\proc\setup_bash_windows.ps1
```

Launcher cross-platform Windows:

```powershell
.\proc\run_import_gedcom.ps1
.\proc\run_validate.ps1
.\proc\run_build.ps1
.\proc\run_download_heraldry_vectors.ps1
```

Import Unix (se disponibile GED testuale):

```bash
./proc/import_gedcom.sh
```

## Validate e Build

Unix:

```bash
./proc/download_heraldry_vectors.sh
./proc/validate_data.sh
./proc/build_portale.sh
```

Per forzare il download vettoriale durante il build:

```bash
DOWNLOAD_HERALDRY_VECTORS=1 ./proc/build_portale.sh
```

Windows:

```powershell
.\proc\run_validate.ps1
.\proc\run_build.ps1
```

Tabella rapida:

| Ambiente | Esecuzione |
|---|---|
| Linux/macOS | `./proc/*.sh` |
| Windows PowerShell | `.\proc\run_*.ps1` |
| Windows CMD | `.\proc\run_*.cmd` |

## Regole File

- UTF-8 senza BOM
- 1 record = 1 riga
- delimitatore `|`
- nessuno spazio attorno al delimitatore
- date: `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, oppure vuoto

## Modulo Nobilta

File:

- `data/nobilta/TITOLI.DAT`
- `data/nobilta/CASATI_TITOLI.DAT`
- `data/nobilta/PERSONE_TITOLI.DAT`
- `data/nobilta/MATRIMONI_TITOLI.DAT`

Output:

- `PORTALE_GN/nobilta/index.html`
- `PORTALE_GN/nobilta/Txxxxxx.html`

Dettagli regole:

- `docs/NOBILTA_SYSTEM.md`

## Integrazione Portale Giardina YAML

Per un flusso editoriale più rapido (mobile-first) è disponibile una pipeline parallela:

- `01_raw/` (upload grezzi)
- `02_curated/` (media rinominati)
- `03_records/` (record YAML)
- `04_site/` (HTML generato)

Comandi:

```bash
make validate
make build
python -m src.portale_giardina.pipeline ingest --record-id "YYYY-MM-DD__tipo__soggetti__luogo__slug" --with-hash
```

Questa integrazione non sostituisce il modello DAT/CPY esistente; lo affianca per una migrazione incrementale.
