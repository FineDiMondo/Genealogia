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

- Proposta GN370-NEXT: vedi [docs/ROADMAP.md](docs/ROADMAP.md) e [docs/LEXICON.md](docs/LEXICON.md)

## Contributing & Development

### For Contributors
- **Getting started**: Read [CONTRIBUTING.md](CONTRIBUTING.md)
  - How to add COBOL commands
  - How to add CICS screens
  - How to add DB migrations
  - Standard dev workflow & PR process
  - Troubleshooting guide

### Technical Standards
- **Roadmap**: [docs/ROADMAP.md](docs/ROADMAP.md) — 7 phases with checkpoints and gates
- **Definition of Done**: [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md) — DoD checklist for each PR
- **Architecture**: [docs/GN370_NEXT_ARCHITECTURE.md](docs/GN370_NEXT_ARCHITECTURE.md) — design principles & patterns
- **Lexicon**: [docs/LEXICON.md](docs/LEXICON.md) — semantic codes v0.1 (reliability, agents, events, etc.)
- **Copybook Format**: [docs/COPYBOOK_FORMAT.md](docs/COPYBOOK_FORMAT.md) — record structure rules

### Build & Test (Local)
```powershell
# COBOL CLI build
.\cobol\build.ps1

# Run all tests (JS + DB migrations + COBOL fixtures)
npm run test:all

# Smoke test COBOL CLI
.\cobol\test.ps1
```

### CI/CD Pipeline
- **tests.yml**: JavaScript + COBOL on every PR (Ubuntu + Windows)
- **GENBLD00.yml**: MVS batch pipeline (GEDCOM → DAT → JSON)
- **pages.yml**: WebAssembly build + GitHub Pages deploy
