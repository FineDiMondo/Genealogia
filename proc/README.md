# proc

Job scripts stile Unix:

- `import_gedcom.sh`: importa `data/import/raw/latest.ged` in file `.DAT`.
- `validate_data.sh`: controlla tracciati e riferimenti.
- `build_portale.sh`: genera HTML statico in `PORTALE_GN/people|families|sources|heraldry|reports`.
- `portale_giardina_validate.sh`: valida record YAML in `03_records/`.
- `portale_giardina_build.sh`: genera sito statico `04_site/`.
- `portale_giardina_ingest.sh`: acquisisce media da `01_raw/` a `02_curated/`.
- `download_heraldry_vectors.sh`: scarica stemmi vettoriali (`.svg`) da URL pubbliche definite in `data/araldica/STEMMI_VECTOR_SOURCES.DAT` e aggiorna `STEMMI.DAT`.
- Modulo nobilta: `validate_data.*` e `build_portale.*` includono `data/nobilta/*.DAT` e generano `PORTALE_GN/nobilta/`.
- `new_person.sh`, `new_family.sh`, `new_source.sh`: inserimento record con ID progressivo.

Download vettoriale (opzionale):

```bash
./proc/download_heraldry_vectors.sh
```

Build con download automatico:

```bash
DOWNLOAD_HERALDRY_VECTORS=1 ./proc/build_portale.sh
```

Job scripts per Windows:

- `import_rmtree.ps1`: importa database RootsMagic `.rmtree` in `data/*.DAT`.
- `validate_data.ps1`: validazione tracciati, riferimenti e asset.
- `build_portale.ps1`: build HTML statico in `PORTALE_GN/`.
- `setup_bash_windows.ps1`: aggiunge Git Bash al `PATH` utente e verifica `bash --version`.

Launcher cross-platform (Windows):

- `run_validate.ps1` / `run_validate.cmd`
- `run_build.ps1` / `run_build.cmd`
- `run_import_gedcom.ps1` / `run_import_gedcom.cmd`
- `run_download_heraldry_vectors.ps1` / `run_download_heraldry_vectors.cmd`

Setup bash una tantum:

```powershell
powershell -ExecutionPolicy Bypass -File .\proc\setup_bash_windows.ps1
```

Uso launcher:

```powershell
.\proc\run_validate.ps1
.\proc\run_build.ps1
.\proc\run_import_gedcom.ps1
.\proc\run_download_heraldry_vectors.ps1
```

Pipeline YAML alternativa:

```bash
./proc/portale_giardina_validate.sh
./proc/portale_giardina_build.sh
./proc/portale_giardina_ingest.sh "YYYY-MM-DD__tipo__soggetti__luogo__slug" --with-hash
```

Log nobiliari:

- `logs/titles_conflicts.log`
- `logs/marriage_title_inconsistencies.log`
