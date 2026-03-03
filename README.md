# Genealogia

Repository multi-componente con obiettivo web pubblico **solo WebAssembly**.

## Perimetro deploy GitHub Pages

- Componente pubblicato: `engine_scummlike_web/` compilato con Emscripten.
- Root statico deploy: `web/` (generato in CI o con `engine_scummlike_web/build_web.cmd`).
- URL produzione: `https://finedimondo.github.io/Genealogia/`

Non vengono pubblicati su Pages:
- launcher nativo SDL2 (`launcher/`)
- pipeline batch/COBOL-like (`mvs/`, `GIARDINA/`, script `.cmd/.ps1/.py`)
- tool locali (`tools/db`, `tools/rootsmagic`, ecc.)

## Build locale WebAssembly

Prerequisiti:
- Docker Desktop
- Python (per script path rewrite)

Comando:

```bat
engine_scummlike_web\build_web.cmd
```

Output:
- `engine_scummlike_web/dist/` (artefatti emscripten)
- `web/` (root deploy-ready con path relativi)

## Deploy GitHub Pages

Workflow attivo:
- `.github/workflows/pages.yml`

Flusso:
1. Build WebAssembly in CI
2. Copia artefatti in `web/`
3. Riscrittura path relativi con `tools/web/prepare_web.py`
4. Deploy Pages da `web/`

## Test locale statico

Dopo build locale:

```bat
python -m http.server 8080
```

Apri:
- `http://127.0.0.1:8080/web/`

## Note path e 404

- Tutti i link/asset del contenuto in `web/` devono essere relativi (`./...`).
- Non usare path assoluti root (`/...`) per evitare 404 su Pages sottopath `/Genealogia/`.

## Architettura evolutiva

- Proposta GN370-NEXT (versione operativa): `docs/GN370_NEXT_ARCHITECTURE.md`
- Piano migrazione COBOL/CICS + SQL + shell Unix: `docs/PIANO_MIGRAZIONE_COBOL_CICS.md`


## Esecuzione iniziale migrazione COBOL/CICS (PoC)

```bash
./scripts/dev/up.sh
./scripts/dev/build_all.sh
./scripts/dev/smoke.sh
./scripts/release/release.sh
```

Asset principali:
- CLI C99 multipiattaforma: `tooling/gnx/`
- DSL di esempio: `specs/individui.gnx`
- Schema SQL baseline: `sql/schema_v1.sql`

## Governance

- Roadmap: `docs/ROADMAP.md`
- Definition of Done: `docs/DEFINITION_OF_DONE.md`
- Lexicon: `docs/LEXICON.md`
